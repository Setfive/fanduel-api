"use strict";
exports.__esModule = true;
var _ = require("lodash");
var FanduelConfig = (function () {
    function FanduelConfig() {
    }
    Object.defineProperty(FanduelConfig.prototype, "username", {
        get: function () {
            return this._username;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FanduelConfig.prototype, "password", {
        get: function () {
            return this._password;
        },
        enumerable: true,
        configurable: true
    });
    return FanduelConfig;
}());
exports.FanduelConfig = FanduelConfig;
var UserInfo = (function () {
    function UserInfo() {
    }
    return UserInfo;
}());
exports.UserInfo = UserInfo;
var Linked = (function () {
    function Linked() {
    }
    return Linked;
}());
var SlateStatus = (function () {
    function SlateStatus() {
    }
    return SlateStatus;
}());
exports.SlateStatus = SlateStatus;
var SlateContestType = (function () {
    function SlateContestType() {
    }
    return SlateContestType;
}());
exports.SlateContestType = SlateContestType;
var SlateContest = (function () {
    function SlateContest() {
    }
    return SlateContest;
}());
exports.SlateContest = SlateContest;
var Slate = (function () {
    function Slate() {
    }
    return Slate;
}());
exports.Slate = Slate;
var SlateDetails = (function () {
    function SlateDetails() {
    }
    return SlateDetails;
}());
exports.SlateDetails = SlateDetails;
var SlateGameStatus = (function () {
    function SlateGameStatus() {
    }
    return SlateGameStatus;
}());
exports.SlateGameStatus = SlateGameStatus;
var SlateGameTeam = (function () {
    function SlateGameTeam() {
    }
    return SlateGameTeam;
}());
exports.SlateGameTeam = SlateGameTeam;
var SlateGame = (function () {
    function SlateGame() {
    }
    return SlateGame;
}());
exports.SlateGame = SlateGame;
var SlateGameWind = (function () {
    function SlateGameWind() {
    }
    return SlateGameWind;
}());
exports.SlateGameWind = SlateGameWind;
var Precipitation = (function () {
    function Precipitation() {
    }
    return Precipitation;
}());
exports.Precipitation = Precipitation;
var SlateGameWeather = (function () {
    function SlateGameWeather() {
    }
    return SlateGameWeather;
}());
exports.SlateGameWeather = SlateGameWeather;
var ContestSpec = (function () {
    function ContestSpec() {
    }
    return ContestSpec;
}());
exports.ContestSpec = ContestSpec;
var EntryFee = (function () {
    function EntryFee() {
    }
    return EntryFee;
}());
exports.EntryFee = EntryFee;
var PrizeStructure = (function () {
    function PrizeStructure() {
    }
    return PrizeStructure;
}());
exports.PrizeStructure = PrizeStructure;
var RosterRestriction = (function () {
    function RosterRestriction() {
    }
    return RosterRestriction;
}());
exports.RosterRestriction = RosterRestriction;
var Fixture = (function () {
    function Fixture() {
    }
    return Fixture;
}());
exports.Fixture = Fixture;
var H2HBuyin = (function () {
    function H2HBuyin() {
    }
    return H2HBuyin;
}());
exports.H2HBuyin = H2HBuyin;
var SlateDetailsContests = (function () {
    function SlateDetailsContests() {
    }
    return SlateDetailsContests;
}());
exports.SlateDetailsContests = SlateDetailsContests;
var ScoringRule = (function () {
    function ScoringRule() {
    }
    return ScoringRule;
}());
exports.ScoringRule = ScoringRule;
var ScoringRuleGroup = (function () {
    function ScoringRuleGroup() {
    }
    return ScoringRuleGroup;
}());
exports.ScoringRuleGroup = ScoringRuleGroup;
var ScoringRuleGroupRule = (function () {
    function ScoringRuleGroupRule() {
    }
    return ScoringRuleGroupRule;
}());
exports.ScoringRuleGroupRule = ScoringRuleGroupRule;
var PlayerPosition = (function () {
    function PlayerPosition() {
    }
    return PlayerPosition;
}());
exports.PlayerPosition = PlayerPosition;
var RosterPosition = (function () {
    function RosterPosition() {
    }
    return RosterPosition;
}());
exports.RosterPosition = RosterPosition;
var ContestResult = (function () {
    function ContestResult() {
    }
    return ContestResult;
}());
exports.ContestResult = ContestResult;
var ContestSubType = (function () {
    function ContestSubType() {
    }
    return ContestSubType;
}());
exports.ContestSubType = ContestSubType;
var ContestType = (function () {
    function ContestType() {
    }
    return ContestType;
}());
exports.ContestType = ContestType;
var ContestPrize = (function () {
    function ContestPrize() {
    }
    return ContestPrize;
}());
exports.ContestPrize = ContestPrize;
var ContstSize = (function () {
    function ContstSize() {
    }
    return ContstSize;
}());
exports.ContstSize = ContstSize;
var ContestH2HEntrants = (function () {
    function ContestH2HEntrants() {
    }
    return ContestH2HEntrants;
}());
exports.ContestH2HEntrants = ContestH2HEntrants;
var ContestH2H = (function () {
    function ContestH2H() {
    }
    return ContestH2H;
}());
exports.ContestH2H = ContestH2H;
var Membered = (function () {
    function Membered() {
    }
    return Membered;
}());
exports.Membered = Membered;
var Contest = (function () {
    function Contest() {
    }
    return Contest;
}());
exports.Contest = Contest;
var Sport = (function () {
    function Sport(which) {
        this.which = which;
    }
    Sport.prototype.toString = function () {
        return this.which;
    };
    return Sport;
}());
Sport.NFL = "NFL";
Sport.NBA = "NBA";
Sport.MLB = "MLB";
Sport.NHL = "NHL";
Sport.EPL = "EPL";
Sport.PGA = "PGA";
Sport.UCL = "UCL";
Sport.WNBA = "WNBA";
exports.Sport = Sport;
var PlayerImage = (function () {
    function PlayerImage() {
    }
    return PlayerImage;
}());
exports.PlayerImage = PlayerImage;
var PlayerImageDetails = (function () {
    function PlayerImageDetails() {
    }
    return PlayerImageDetails;
}());
exports.PlayerImageDetails = PlayerImageDetails;
var PlayerNews = (function () {
    function PlayerNews() {
    }
    return PlayerNews;
}());
exports.PlayerNews = PlayerNews;
var PlayerPositionStat = (function () {
    function PlayerPositionStat() {
    }
    return PlayerPositionStat;
}());
exports.PlayerPositionStat = PlayerPositionStat;
var Player = (function () {
    function Player() {
    }
    return Player;
}());
exports.Player = Player;
var Lineup = (function () {
    function Lineup(slateDetails) {
        this.roster = [];
        this.projectedFanduelPoints = 0;
        this.roster = slateDetails.roster_positions.map(function (f) { return { position: f.abbr, player: null }; });
        this.remainingSalary = slateDetails.salary_cap;
    }
    Lineup.prototype.clone = function () {
        var l = _.cloneDeep(this);
        l.isFull = null;
        l.isPossibleRoster = null;
        l.isValidRoster = null;
        return l;
    };
    return Lineup;
}());
exports.Lineup = Lineup;
var LineupPlayer = (function () {
    function LineupPlayer() {
    }
    return LineupPlayer;
}());
exports.LineupPlayer = LineupPlayer;
var LineupPlayerPosition = (function () {
    function LineupPlayerPosition() {
    }
    return LineupPlayerPosition;
}());
exports.LineupPlayerPosition = LineupPlayerPosition;
var Prize = (function () {
    function Prize() {
    }
    return Prize;
}());
exports.Prize = Prize;
var ContestEntry = (function () {
    function ContestEntry() {
    }
    return ContestEntry;
}());
exports.ContestEntry = ContestEntry;
var RosterTeam = (function () {
    function RosterTeam() {
    }
    return RosterTeam;
}());
exports.RosterTeam = RosterTeam;
var UpcomingRosterRoster = (function () {
    function UpcomingRosterRoster() {
    }
    return UpcomingRosterRoster;
}());
exports.UpcomingRosterRoster = UpcomingRosterRoster;
var UpcomingRosterLineupPlayer = (function () {
    function UpcomingRosterLineupPlayer() {
    }
    return UpcomingRosterLineupPlayer;
}());
exports.UpcomingRosterLineupPlayer = UpcomingRosterLineupPlayer;
var UpcomingRoster = (function () {
    function UpcomingRoster() {
    }
    return UpcomingRoster;
}());
exports.UpcomingRoster = UpcomingRoster;
