import * as fs from "fs";
import * as _ from "lodash";
import {dirname} from "path";
import Fanduel from "../index";
import {Slate} from "../models";

const auth = JSON.parse(fs.readFileSync("../auth.json", "utf8"));
const fd = new Fanduel(auth);

let targetSlate: Slate = null;

function getTargetSlate() {
    return fd.getAvailableSlates().then(slates => {
        targetSlate = _.find(slates, f => f.sport == "MLB");
        console.log("Playing: " + targetSlate.sport + " (" + targetSlate.label + ") at " + targetSlate.start_date);
    });
}

function getSlateDetails() {
    return fd.getDetailsForSlate(targetSlate).then(slateDetails => {
        console.log("Salary Cap: " + slateDetails.salary_cap);
        console.log("Positions: " + slateDetails.roster_positions.map(f => f.full).join(", "));
        console.log("\n");

        console.log("Games:");
        slateDetails.games.forEach(game => {
            console.log(game.start_date + ": " + game.away_team.team.full_name + " at " + game.home_team.team.full_name);
        });

        console.log("\n");
    });
}

function getSuperstarPlayers(){
    return fd.getPlayersForSlate(targetSlate).then(playerList => {
        const sortedPlayers = _.sortBy(playerList, f => f.salary).slice(0, 5);
        console.log("Top 5 players by salary:");
        sortedPlayers.forEach(player => {
            console.log("$" + player.salary + ": (" + player.position + ") " + player.last_name + ", " + player.last_name);
        });

        console.log("\n");
    });
}

function createLineup() {
    return fd.createValidLineupForSlate(targetSlate, 5000).then(lineup => {
        console.log("Auto Generated Lineup:");
        console.log("Projected Fanduel Points: " + lineup.projectedFanduelPoints);

        lineup.roster.forEach(l => {
            console.log(l.position + ": " + l.player.last_name + ", " + l.player.last_name);
        });

        process.exit(0);
    });
}

getTargetSlate()
    .then(getSlateDetails)
    .then(getSuperstarPlayers)
    .then(createLineup)
    .catch(e => {
        console.error(e);
    })
;