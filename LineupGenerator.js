"use strict";
exports.__esModule = true;
var _ = require("lodash");
var Q = require("q");
var models_1 = require("./models");
var LineupSearch = (function () {
    function LineupSearch(searchIndex, currentLineup) {
        this.searchIndex = searchIndex;
        this.currentLineup = currentLineup;
    }
    return LineupSearch;
}());
var LineupGenerator = (function () {
    function LineupGenerator(slateDetails, players) {
        this.isHalted = false;
        this.queuedLineups = [];
        this.validLineups = [];
        this.slateDetails = slateDetails;
        this.players = players;
    }
    LineupGenerator.prototype.createValidLineup = function (timeout) {
        var _this = this;
        if (timeout === void 0) { timeout = 10000; }
        this.queuedLineups = [];
        this.validLineups = [];
        this.lineupDeferred = Q.defer();
        var lt = new models_1.Lineup(this.slateDetails);
        var playerPool = _.filter(this.players, function (f) { return f.injured == false && f.fppg > 0; });
        this.groupedPlayers = _.mapValues(_.groupBy(playerPool, function (f) { return f.position; }), function (list) { return _.sortBy(list, "fppg"); });
        this.bestFirstPlayers = _.mapValues(this.groupedPlayers, function (list) { return list.reverse(); });
        this.salarySortedPlayers = _.mapValues(this.groupedPlayers, function (list) { return _.sortBy(list, "salary"); });
        this.queuedLineups = _.range(0, 1000).map(function (f) {
            var indexes = _.mapValues(_this.groupedPlayers, function (list) { return _this.randomInt(0, list.length); });
            return new LineupSearch(indexes, lt);
        });
        this.processQueuedLineups();
        setTimeout(function () {
            var bestLineup = _this.validLineups.length ? _this.validLineups[0] : null;
            _this.isHalted = true;
            _this.lineupDeferred.resolve(bestLineup);
        }, timeout);
        return this.lineupDeferred.promise;
    };
    LineupGenerator.prototype.processQueuedLineups = function () {
        if (this.isHalted == true) {
            return;
        }
        var args = this.queuedLineups.shift();
        this.searchValidLineupsForRoster.call(this, args);
        if (this.queuedLineups.length) {
            // this.queuedLineups = _.shuffle(this.queuedLineups);
            setImmediate(this.processQueuedLineups.bind(this));
        }
        else {
            this.lineupDeferred.resolve();
            this.isHalted = true;
        }
    };
    LineupGenerator.prototype.searchValidLineupsForRoster = function (searchParams) {
        if (!this.isValidRosterTree(searchParams)) {
            return;
        }
        var targetPosition = _.find(searchParams.currentLineup.roster, { player: null });
        if (targetPosition == null
            || searchParams.searchIndex[targetPosition.position] >= this.groupedPlayers[targetPosition.position].length) {
            return;
        }
        var playerToAdd = this.groupedPlayers[targetPosition.position][searchParams.searchIndex[targetPosition.position]];
        var updatedRoster = this.addPlayerToRoster(playerToAdd, searchParams.currentLineup);
        if (updatedRoster.isValidRoster) {
            this.sortAndTrimLineups(updatedRoster);
            return;
        }
        if (updatedRoster.isPossibleRoster) {
            var nextSearch = _.extend({}, searchParams);
            nextSearch.searchIndex[targetPosition.position] += 1;
            this.queuedLineups.push(nextSearch);
        }
        searchParams.currentLineup = updatedRoster;
        this.searchValidLineupsForRoster(searchParams);
    };
    LineupGenerator.prototype.sortAndTrimLineups = function (lineup) {
        this.validLineups.push(lineup);
        this.validLineups = _.sortBy(this.validLineups, function (f) { return f.projectedFanduelPoints; }).reverse();
        this.validLineups = this.validLineups.slice(0, 10);
    };
    LineupGenerator.prototype.addPlayerToRoster = function (playerToAdd, lineup) {
        var didAdd = false;
        var newLineup = lineup.clone();
        for (var i = 0; i < newLineup.roster.length && didAdd == false; i++) {
            if (newLineup.roster[i].player && newLineup.roster[i].player.id == playerToAdd.id) {
                didAdd = false;
                break;
            }
            if (newLineup.roster[i].position == playerToAdd.position && newLineup.roster[i].player == null) {
                newLineup.roster[i].player = playerToAdd;
                didAdd = true;
            }
        }
        newLineup.projectedFanduelPoints = _.reduce(newLineup.roster, function (total, p) { return total + (p.player ? p.player.fppg : 0); }, 0);
        newLineup.remainingSalary -= playerToAdd.salary;
        if (didAdd == false || newLineup.remainingSalary < 0) {
            newLineup.isValidRoster = false;
            return newLineup;
        }
        var occupiedRosters = newLineup.roster.filter(function (f) { return f.player != null; });
        var rosterPitcher = _.find(newLineup.roster, function (p) { return p.position == "P"; });
        var hasPitcherAndBatterFromSameTeam = false;
        var pitcherTeam = null;
        if (rosterPitcher) {
            var pitcherTeamates = occupiedRosters
                .map(function (f) { return f.player.team; })
                .filter(function (f) { return f == rosterPitcher.player.team; });
            hasPitcherAndBatterFromSameTeam = pitcherTeamates.length > 1;
        }
        var uniqueTeams = occupiedRosters.map(function (f) { return f.player.team; });
        var hasAtLeastThreeTeams = _.uniq(uniqueTeams).length >= 3;
        var groupedByTeam = _.mapValues(_.groupBy(occupiedRosters, function (e) { return e.player.team._members[0]; }), function (e) { return e.length; });
        var greaterThanFourPerTeam = _.values(groupedByTeam).filter(function (f) { return f > 4; });
        var hasLessThanFourPerTeam = greaterThanFourPerTeam.length == 0 ? true : false;
        var emptyPositions = newLineup.roster.filter(function (f) { return f.player == null; });
        newLineup.isFull = emptyPositions.length == 0 ? true : false;
        newLineup.isPossibleRoster = hasLessThanFourPerTeam ? true : false;
        newLineup.isValidRoster = hasAtLeastThreeTeams && hasLessThanFourPerTeam && newLineup.isFull && !hasPitcherAndBatterFromSameTeam;
        return newLineup;
    };
    LineupGenerator.prototype.isValidRosterTree = function (searchParams) {
        var _this = this;
        var emptyPlayers = searchParams.currentLineup.roster.filter(function (f) { return f.player == null; });
        var lowestRemainingSalary = emptyPlayers
            .map(function (f) { return _this.salarySortedPlayers[f.position][0].salary; })
            .reduce(function (total, salary) { return total + salary; }, 0);
        var bestPossiblePlayerPoints = emptyPlayers
            .map(function (f) {
            var targetPlayer = _.find(_this.bestFirstPlayers[f.position], function (ix) { return searchParams.currentLineup.remainingSalary; });
            return targetPlayer ? targetPlayer.fppg : 0;
        })
            .reduce(function (total, fppg) { return total + fppg; }, 0);
        if (lowestRemainingSalary > searchParams.currentLineup.remainingSalary) {
            return false;
        }
        if (this.validLineups.length) {
            if (bestPossiblePlayerPoints + searchParams.currentLineup.projectedFanduelPoints
                < this.validLineups[0].projectedFanduelPoints) {
                return false;
            }
        }
        return true;
    };
    LineupGenerator.prototype.randomInt = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    return LineupGenerator;
}());
exports.LineupGenerator = LineupGenerator;
