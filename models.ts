import {CookieJar, Headers} from "request";
import * as _ from "lodash";

export class FanduelConfig {
    private _username : string;
    private _password : string;

    get username(): string {
        return this._username;
    }

    get password(): string {
        return this._password;
    }
}

export interface IDefaultOptions {
    followRedirect : boolean;
    followAllRedirects : boolean;
    jar : CookieJar;
    headers : Headers;
}

export class UserInfo {
    id: string;
    username : string;
    apiClientId : string;
}

class Linked {
    _url : string;
}

export class SlateStatus {
    final : boolean;
    started : boolean;
}

export class SlateContestType {
    _members : string[];
    count : number;
    _ref : string;
}

export class SlateContest  {
    pinned_count : number;
    _url : string;
    contest_types : SlateContestType[];
}

export class Slate {
    start_date : string;
    id : string;
    late_swap : boolean;
    salary_cap : number;
    label : string;
    sport : string;
    _url : string;
    status : SlateStatus;
    contests? : SlateContest;
    players? : Linked;
}

export class SlateDetails {
    label : string;
    sport : string;
    contests : SlateDetailsContests;
    players : Linked;
    h2h_buyins : H2HBuyin[];
    roster_positions : RosterPosition[];
    scoring_rules : ScoringRule;
    status : SlateStatus;
    player_positions : PlayerPosition[];
    fixtures : Fixture;
    roster_restrictions : RosterRestriction;
    _url : string;
    contest_specs : ContestSpec[];
    salary_cap : number;
    id : string;
    late_swap : boolean;
    games : SlateGame[];
}

export class SlateGameStatus {
    final : boolean;
    started : boolean;
    label : string;
    stadium_type : string;
    weather : string;
    top_bottom : string;
}

export class SlateGameTeam {
    team : string;
    sport_specific : any;
    score : string;
}

export class SlateGame {
    name : string;
    sport : string;
    start_date : string;
    id : string;
    status : SlateGameStatus;
    away_team : SlateGameTeam;
    home_team : SlateGameTeam;
    weather? : SlateGameWeather;
    wind? : SlateGameWind;
}

export class SlateGameWind {
    speed : number;
    bearing : number;
}

export class Precipitation {
    time : string;
    probability : number;
    intensity : string;
}

export class SlateGameWeather {
    precipitation : Precipitation[];
}

export class ContestSpec {
    id : string;
    contest_type : string;
    prize_structures : PrizeStructure[];
    entry_fees : EntryFee[];
    max_size : number;
    min_size : number;
}

export class EntryFee {
    entry_fee_fdp : number;
    entry_fee : number;
}

export class PrizeStructure {
    name : string;
    description : string;
    entry_fees : number[];
}

export class RosterRestriction {
    max_players : number;
    min_fixtures : number;
    min_teams : number;
    max_players_from_team : number;
    min_players : number;
    player_position_restrictions : any[];
}

export class Fixture {
    _members : string[];
    _ref : string;
}

export class H2HBuyin {
    entry_fee_fdp : number;
    prize : number;
    entry_fee : number;
}

export class SlateDetailsContests {
    open : Linked;
}

export class ScoringRule {
    notes : string[];
    groups : ScoringRuleGroup;
}

export class ScoringRuleGroup {
    name : string;
    rules : ScoringRuleGroupRule[];
}

export class ScoringRuleGroupRule {
    abbr : string;
    points : number;
    full : string;
}

export class PlayerPosition {
    abbr : string;
    full : string;
}

export class RosterPosition {
    abbr : string;
    full : string;
    valid_player_positions : string[];
}

export class ContestResult {
    contests : Contest[];
    entry_fees : number[];
    fixture_lists : Slate[];
    contest_types : ContestType[];
    contest_sub_types : ContestSubType[];
}

export class ContestSubType {
    id : string;
    label : string;
}

export class ContestType {
    id : string;
    label : string;
    description : string;
}

export class ContestPrize {
    total : number;
    count : number;
    summary : string;
}

export class ContstSize {
    min : number;
    max : number;
}

export class ContestH2HEntrants {
    _members : string[];
}

export class ContestH2H {
    entrants : ContestH2HEntrants;
}

export class Membered {
    _members : string[];
}

export class Contest {
    id : string;
    open_count : number;
    restricted : boolean;
    entries : Linked;
    display_priority : number;
    prizes : ContestPrize;
    name : string;
    _url : string;
    levels : any[];
    user_created : boolean;
    features : any;
    size : ContstSize;
    h2h : ContestH2H;
    guaranteed : boolean;
    entry_fee_fdp : number;
    entry_fee : number;
    pinned : boolean;
    max_entries_per_user : number;
    type : Membered;
}

export class Sport {
    public static NFL = "NFL";
    public static NBA = "NBA";
    public static MLB = "MLB";
    public static NHL = "NHL";
    public static EPL = "EPL";
    public static PGA = "PGA";
    public static UCL = "UCL";
    public static WNBA = "WNBA";

    private which : string;

    constructor(which : string){
        this.which = which;
    }

    public toString() : string {
        return this.which;
    }
}

export class PlayerImage {
    default : PlayerImageDetails;
}

export class PlayerImageDetails {
    height : number;
    width : number;
    url : string;
}

export class PlayerNews {
    latest : string;
}

export class PlayerPositionStat {
    fppg : number;
    player_position : string;
    roster_position : string;
}

export class Player {
    first_name : string;
    fppg : number;
    id : string;
    injured : boolean;
    injury_details : string;
    injury_status : string;
    jersey_number : number;
    last_name : string;
    played : number;
    player_card_url : string;
    position : string;
    probable_pitcher : boolean;
    removed : boolean;
    salary : number;
    sport_specific : any;
    starting_order : number;
    swappable : boolean;
    images : PlayerImage;
    fixture : Fixture;
    news : PlayerNews;
    roster_position_stats : PlayerPositionStat[];
    team : Fixture;
}

export class Lineup {
    roster : LineupPlayerPosition[] = [];
    projectedFanduelPoints : number = 0;
    remainingSalary : number;
    isFull : boolean;
    isPossibleRoster : boolean;
    isValidRoster : boolean;

    constructor(slateDetails : SlateDetails){
        this.roster = slateDetails.roster_positions.map(f => {return {position: f.abbr, player: null};});
        this.remainingSalary = slateDetails.salary_cap;
    }

    clone() : Lineup {
        const l = _.cloneDeep(this);
        l.isFull = null;
        l.isPossibleRoster = null;
        l.isValidRoster = null;
        return l;
    }
}

export class LineupPlayer {
    id : string;
}

export class LineupPlayerPosition {
    position : string;
    player : Player;
}

export class ContestEntry {
    id : string;
    _url : string;
}

export class RosterTeam {
    name : string;
    colors : any;
    full_name : string;
    id : string;
    city : string;
    code : string;
}

export class UpcomingRosterRoster {
    name : string;
    prize_total : number;
    id : string;
    grouped_entries : any;
    entries : any;
    stake_total : number;
    last_used : string;
    fixture_list : Fixture;
    lineup_share_url : string;
    lineup : UpcomingRosterLineupPlayer[];
    score : number;
    _url : string;
    ppr : number;
}

export class UpcomingRosterLineupPlayer {
    player_position : string;
    player : Player;
    status : any;
    position : string;
    salary : number;
}

export class UpcomingRoster {
    rosters : UpcomingRosterRoster[];
    players : Player[];
    fixtures : SlateGame[];
    fixture_lists : Slate[];
    teams : RosterTeam[];
}

export interface ILineup {
    roster : LineupPlayerPosition[];
}