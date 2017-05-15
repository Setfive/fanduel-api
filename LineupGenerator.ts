import * as _ from "lodash";
import * as Q from "q";
import {Lineup, Player, SlateDetails, Fixture} from "./models";

class LineupSearch {
    searchIndex : { [key:string] : number; };
    currentLineup : Lineup;
    constructor(searchIndex : { [key:string] : number; }, currentLineup : Lineup){
        this.searchIndex = searchIndex;
        this.currentLineup = currentLineup;
    }
}

export class LineupGenerator {

    slateDetails : SlateDetails;
    players : Player[];
    lineupDeferred : Q.Deferred<Lineup>;

    groupedPlayers : { [key:string] : Player[]; };
    bestFirstPlayers : { [key:string] : Player[]; };
    salarySortedPlayers : { [key:string] : Player[]; };

    isHalted : boolean = false;
    queuedLineups : LineupSearch[] = [];
    validLineups : Lineup[] = [];

    constructor(slateDetails : SlateDetails, players : Player[]){
        this.slateDetails = slateDetails;
        this.players = players;
    }

    public createValidLineup() : Q.Promise<Lineup> {
        this.queuedLineups = [];
        this.validLineups = [];
        this.lineupDeferred = Q.defer<Lineup>();

        let lt = new Lineup(this.slateDetails);

        const playerPool = _.filter(this.players, f => f.injured == false && f.fppg > 0);

        this.groupedPlayers = _.mapValues(_.groupBy(playerPool, f => f.position), list => _.sortBy(list, "fppg"));
        this.bestFirstPlayers = _.mapValues(this.groupedPlayers, list => list.reverse());
        this.salarySortedPlayers = _.mapValues(this.groupedPlayers, list => _.sortBy(list, "salary"));

        this.queuedLineups = _.range(0, 1000).map(f => {
            const indexes = _.mapValues(this.groupedPlayers, list => this.randomInt(0, list.length));
            return new LineupSearch(indexes, lt);
        });

        this.processQueuedLineups();

        return this.lineupDeferred.promise;
    }

    public processQueuedLineups(): void {

        if (this.isHalted == true) {
            return;
        }

        const args = this.queuedLineups.shift();
        this.searchValidLineupsForRoster.call(this, args);

        if (this.queuedLineups.length) {
            this.queuedLineups = _.shuffle(this.queuedLineups);
            setImmediate(this.processQueuedLineups.bind(this));
        } else {
            this.lineupDeferred.resolve();
            this.isHalted = true;
        }

    }

    public searchValidLineupsForRoster(searchParams : LineupSearch) : void {

        if(!this.isValidRosterTree(searchParams)){
            return;
        }

        const targetPosition = _.find(searchParams.currentLineup.roster, {player: null});

        if(targetPosition == null
            || searchParams.searchIndex[targetPosition.position] >= this.groupedPlayers[targetPosition.position].length){
            return;
        }

        const playerToAdd = this.groupedPlayers[targetPosition.position][ searchParams.searchIndex[targetPosition.position] ];
        const updatedRoster = this.addPlayerToRoster(playerToAdd, searchParams.currentLineup);

        const nextSearch = _.extend({}, searchParams);
        nextSearch.searchIndex[targetPosition.position] += 1;
        this.queuedLineups.push(nextSearch);
    }

    public addPlayerToRoster(playerToAdd : Player, lineup : Lineup) : Lineup {
        let didAdd = false;
        const newLineup = lineup.clone();

        for(var i = 0; i < newLineup.roster.length && didAdd == false; i++){
            if(newLineup.roster[i].player && newLineup.roster[i].player.id == playerToAdd.id){
                didAdd = false;
                break;
            }

            if(newLineup.roster[i].position == playerToAdd.position && newLineup.roster[i].player == null){
                newLineup.roster[i].player = playerToAdd;
                didAdd = true;
            }
        }

        newLineup.projectedFanduelPoints = _.reduce(newLineup.roster,
                                                    (total, p) => total + (p.player ? p.player.fppg : 0), 0);

        newLineup.remainingSalary -= playerToAdd.salary;

        if(didAdd == false || newLineup.remainingSalary < 0){
            newLineup.isValidRoster = false;
            return newLineup;
        }

        const occupiedRosters = newLineup.roster.filter(f => f.player != null);
        const rosterPitcher = _.find(newLineup.roster, p => p.position == "P");

        let hasPitcherAndBatterFromSameTeam = false;
        let pitcherTeam : Fixture = null;

        if(rosterPitcher){
            const pitcherTeamates = occupiedRosters
                                        .map(f => f.player.team)
                                        .filter(f => f == rosterPitcher.player.team);

            hasPitcherAndBatterFromSameTeam = pitcherTeamates.length > 1;
        }

        const uniqueTeams = occupiedRosters.map(f => f.player.team);
        const hasAtLeastThreeTeams = _.uniq(uniqueTeams).length >= 3;

        const groupedByTeam = _.mapValues(_.groupBy(occupiedRosters, e => e.player.team._members[0]), e => e.length);
        const greaterThanFourPerTeam = _.values(groupedByTeam).filter(f => f > 4);
        const hasLessThanFourPerTeam = greaterThanFourPerTeam.length == 0 ? true : false;

        const emptyPositions = newLineup.roster.filter(f => f.player == null);

        newLineup.isFull = emptyPositions.length == 0 ? true : false;
        newLineup.isPossibleRoster = hasLessThanFourPerTeam ? true : false;
        newLineup.isValidRoster = hasAtLeastThreeTeams && hasLessThanFourPerTeam && newLineup.isFull && !hasPitcherAndBatterFromSameTeam;

        return newLineup;
    }

    public isValidRosterTree(searchParams : LineupSearch) : boolean {

        const emptyPlayers = searchParams.currentLineup.roster.filter(f => f.player == null);
        const lowestRemainingSalary = emptyPlayers
                                       .map(f => this.salarySortedPlayers[f.position][0].salary)
                                       .reduce((total, salary) => total + salary, 0);

        const bestPossiblePlayerPoints = emptyPlayers
            .map(f => {
                const targetPlayer = _.find(this.bestFirstPlayers[f.position], ix => searchParams.currentLineup.remainingSalary);
                return targetPlayer ? targetPlayer.fppg : 0;
            })
            .reduce((total, fppg) => total + fppg, 0);

        if(lowestRemainingSalary > searchParams.currentLineup.remainingSalary){
            return false;
        }

        if(this.validLineups.length){
            if(bestPossiblePlayerPoints + searchParams.currentLineup.projectedFanduelPoints
                    < this.validLineups[0].projectedFanduelPoints){
                return false;
            }
        }

        return true;
    }

    public randomInt(min : number, max : number) : number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}