"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
class FanduelConfig {
    get username() {
        return this._username;
    }
    get password() {
        return this._password;
    }
}
exports.FanduelConfig = FanduelConfig;
class UserInfo {
}
exports.UserInfo = UserInfo;
class Linked {
}
class SlateStatus {
}
exports.SlateStatus = SlateStatus;
class SlateContestType {
}
exports.SlateContestType = SlateContestType;
class SlateContest {
}
exports.SlateContest = SlateContest;
class Slate {
}
exports.Slate = Slate;
class SlateDetails {
}
exports.SlateDetails = SlateDetails;
class SlateGameStatus {
}
exports.SlateGameStatus = SlateGameStatus;
class SlateGameTeam {
}
exports.SlateGameTeam = SlateGameTeam;
class SlateGame {
}
exports.SlateGame = SlateGame;
class SlateGameWind {
}
exports.SlateGameWind = SlateGameWind;
class Precipitation {
}
exports.Precipitation = Precipitation;
class SlateGameWeather {
}
exports.SlateGameWeather = SlateGameWeather;
class ContestSpec {
}
exports.ContestSpec = ContestSpec;
class EntryFee {
}
exports.EntryFee = EntryFee;
class PrizeStructure {
}
exports.PrizeStructure = PrizeStructure;
class RosterRestriction {
}
exports.RosterRestriction = RosterRestriction;
class Fixture {
}
exports.Fixture = Fixture;
class H2HBuyin {
}
exports.H2HBuyin = H2HBuyin;
class SlateDetailsContests {
}
exports.SlateDetailsContests = SlateDetailsContests;
class ScoringRule {
}
exports.ScoringRule = ScoringRule;
class ScoringRuleGroup {
}
exports.ScoringRuleGroup = ScoringRuleGroup;
class ScoringRuleGroupRule {
}
exports.ScoringRuleGroupRule = ScoringRuleGroupRule;
class PlayerPosition {
}
exports.PlayerPosition = PlayerPosition;
class RosterPosition {
}
exports.RosterPosition = RosterPosition;
class ContestResult {
}
exports.ContestResult = ContestResult;
class ContestSubType {
}
exports.ContestSubType = ContestSubType;
class ContestType {
}
exports.ContestType = ContestType;
class ContestPrize {
}
exports.ContestPrize = ContestPrize;
class ContstSize {
}
exports.ContstSize = ContstSize;
class ContestH2HEntrants {
}
exports.ContestH2HEntrants = ContestH2HEntrants;
class ContestH2H {
}
exports.ContestH2H = ContestH2H;
class Membered {
}
exports.Membered = Membered;
class Contest {
}
exports.Contest = Contest;
class Sport {
    constructor(which) {
        this.which = which;
    }
    toString() {
        return this.which;
    }
}
Sport.NFL = "NFL";
Sport.NBA = "NBA";
Sport.MLB = "MLB";
Sport.NHL = "NHL";
Sport.EPL = "EPL";
Sport.PGA = "PGA";
Sport.UCL = "UCL";
Sport.WNBA = "WNBA";
exports.Sport = Sport;
class PlayerImage {
}
exports.PlayerImage = PlayerImage;
class PlayerImageDetails {
}
exports.PlayerImageDetails = PlayerImageDetails;
class PlayerNews {
}
exports.PlayerNews = PlayerNews;
class PlayerPositionStat {
}
exports.PlayerPositionStat = PlayerPositionStat;
class Player {
}
exports.Player = Player;
class Lineup {
    constructor(slateDetails) {
        this.roster = [];
        this.projectedFanduelPoints = 0;
        this.roster = slateDetails.roster_positions.map(f => { return { position: f.abbr, player: null }; });
        this.remainingSalary = slateDetails.salary_cap;
    }
    clone() {
        const l = _.cloneDeep(this);
        l.isFull = null;
        l.isPossibleRoster = null;
        l.isValidRoster = null;
        return l;
    }
}
exports.Lineup = Lineup;
class LineupPlayer {
}
exports.LineupPlayer = LineupPlayer;
class LineupPlayerPosition {
}
exports.LineupPlayerPosition = LineupPlayerPosition;
class Prize {
}
exports.Prize = Prize;
class ContestEntry {
}
exports.ContestEntry = ContestEntry;
class RosterTeam {
}
exports.RosterTeam = RosterTeam;
class UpcomingRosterRoster {
}
exports.UpcomingRosterRoster = UpcomingRosterRoster;
class UpcomingRosterLineupPlayer {
}
exports.UpcomingRosterLineupPlayer = UpcomingRosterLineupPlayer;
class UpcomingRoster {
}
exports.UpcomingRoster = UpcomingRoster;
class WebsocketUpdate {
}
exports.WebsocketUpdate = WebsocketUpdate;
class WebsocketUpdateData {
}
exports.WebsocketUpdateData = WebsocketUpdateData;
class WebsocketAdditionDetail {
}
exports.WebsocketAdditionDetail = WebsocketAdditionDetail;
class WebsocketModificationDetail {
}
exports.WebsocketModificationDetail = WebsocketModificationDetail;
