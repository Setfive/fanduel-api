import * as fs from "fs";
import * as _ from "lodash";
import * as request from "request";
import * as Q from "q";
import * as WebSocket from "ws";
import {
    FanduelConfig, IDefaultOptions, Slate, SlateDetails, UserInfo, Contest, ContestResult, Sport,
    Player, SlateGame, Lineup, Fixture, ContestEntry, UpcomingRoster, ILineup, UpcomingRosterRoster, WebsocketUpdate,
    Team
} from "./models";
import {CookieJar, RequestResponse} from "request";
import {LineupGenerator} from "./LineupGenerator";
import * as util from "util";

// (<any> request).debug = true;

export default class Fanduel {

    private config : FanduelConfig;
    private cookieJar : CookieJar = request.jar();
    private defaultOptions : IDefaultOptions = {
        followRedirect: true,
        followAllRedirects: true,
        jar: this.cookieJar,
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:52.0) Gecko/20100101 Firefox/52.0',
        }
    };

    private userInfo : UserInfo = new UserInfo();
    private hasAuthentication : boolean = false;
    private lastLoginAt : Date;

    private ws : WebSocket;
    private websocketListeners : ((message : WebsocketUpdate) => void)[] = [];

    constructor(config : FanduelConfig){
        this.config = config;
    }

    public getAvailableContestsForSlateId(slate : Slate) : Q.Promise<ContestResult> {
        const result : Q.Deferred<ContestResult> = Q.defer<ContestResult>();

        this.makeRequest("https://api.fanduel.com/contests?fixture_list=" + slate.id + "&include_restricted=false")
            .then(requestResult => {
                const contestResult = <ContestResult> requestResult;
                contestResult.entry_fees = requestResult._meta.entry_fees;
                result.resolve(contestResult);
        });

        return result.promise;
    }

    public getDetailsForSlateId(id : string) : Q.Promise<SlateDetails> {
        const result : Q.Deferred<SlateDetails> = Q.defer<SlateDetails>();

        this.makeRequest("https://api.fanduel.com/fixture-lists/" + id)
            .then(requestResult => {
                const teams = <Team[]> requestResult.teams;
                const intermediateDetails : any = _.extend(requestResult.fixture_lists[0], {games: requestResult.fixtures});

                intermediateDetails.games = (<any[]> intermediateDetails.games).map(f => {
                    const awayTeam : Team = _.find(teams, t => t.id == f["away_team"]["team"]["_members"][0]);
                    f.away_team = {team: awayTeam,
                                   score: f["away_team"]["score"],
                                   sport_specific: f["away_team"]["sport_specific"]};

                    const homeTeam : Team = _.find(teams, t => t.id == f["home_team"]["team"]["_members"][0]);
                    f.home_team = {team: homeTeam,
                                   score: f["home_team"]["score"],
                                   sport_specific: f["home_team"]["sport_specific"]};


                    return f;
                });

                result.resolve(<SlateDetails> intermediateDetails);
            })
            .catch(result.reject)
        ;

        return result.promise;
    }

    public getDetailsForSlate(slate : Slate) : Q.Promise<SlateDetails> {
        return this.getDetailsForSlateId(slate.id);
    }

    public getAvailableSlates() : Q.Promise<Slate[]> {
        const result : Q.Deferred<Slate[]> = Q.defer<Slate[]>();

        this.makeRequest("https://api.fanduel.com/fixture-lists")
            .then(requestResult => {
                const slateResult = (<any[]>requestResult.fixture_lists).map(f => {
                    f.contests = f.contests.open;
                    return <Slate> f;
                });

                result.resolve(slateResult);
            })
            .catch(result.reject)
        ;

        return result.promise;
    }

    public getUpcomingRosters() : Q.Promise<UpcomingRoster> {
        const result : Q.Deferred<UpcomingRoster> = Q.defer<UpcomingRoster>();

        this.login().then(() => {
            this.makeRequest("https://api.fanduel.com/users/"
                                + this.userInfo.id + "/rosters?page=1&page_size=1000&status=upcoming")
                .then(requestResult => {
                    const up = new UpcomingRoster();
                    _.assignIn(up, requestResult);
                    result.resolve(up);
                })
                .catch(result.reject)
            ;
        });

        return result.promise;
    }

    public getGamesForSlate(slate : Slate) : Q.Promise<SlateGame[]> {
        const result : Q.Deferred<SlateGame[]> = Q.defer<SlateGame[]>();

        this.makeRequest("https://api.fanduel.com/fixture-lists/" + slate.id + "/players")
            .then(requestResult => {
                result.resolve(<SlateGame[]> requestResult.fixtures);
            })
            .catch(result.reject)
        ;

        return result.promise;
    }

    public getPlayersForSlateId(id : string) : Q.Promise<Player[]> {
        const result : Q.Deferred<Player[]> = Q.defer<Player[]>();

        this.makeRequest("https://api.fanduel.com/fixture-lists/" + id + "/players")
            .then(requestResult => {
                result.resolve(<Player[]> requestResult.players);
            })
            .catch(result.reject)
        ;

        return result.promise;
    }

    public getPlayersForSlate(slate : Slate) : Q.Promise<Player[]> {
        return this.getPlayersForSlateId(slate.id);
    }

    public createValidLineupForSlate(slate : Slate, timeout : number = 10000) : Q.Promise<Lineup> {
        const finalLineupDf : Q.Deferred<Lineup> = Q.defer<Lineup>();
        const players = this.getPlayersForSlate(slate);
        const slateDetails = this.getDetailsForSlate(slate);

        Q.all([slateDetails, players]).then((result) => {
            const generator = new LineupGenerator(result[0], result[1]);
            generator.createValidLineup(timeout).then(lineupResult => {
                finalLineupDf.resolve(lineupResult);
            });
        });

        return finalLineupDf.promise;
    }

    public createEntryForContest(slate : Slate, contest : Contest, lineup : ILineup) : Q.Promise<ContestEntry[]> {
        return this.rosterRequest(slate, contest.id, lineup, false);
    }

    public updateEntryForContest(upcomingRoster : UpcomingRosterRoster, lineup : ILineup) : Q.Promise<boolean> {
        const roster = lineup.roster.map(f => { return {position: f.position, player: {id: f.player.id}};});
        const requestBody = {
            rosters: [{lineup: roster}]
        };

        const url = "https://api.fanduel.com/users/" + this.userInfo.id + "/rosters/" + upcomingRoster.id + "/transfer-entries";
        const body = JSON.stringify(requestBody);
        const options = _.extend({}, this.defaultOptions, {method: "POST", body: body});
        options.headers["Content-Type"] = "application/json;charset=utf-8";

        const df = Q.defer<boolean>();

        this.makeRequest(url, options).then(result => { df.resolve(true); });

        return df.promise;
    }

    public cancelEntryForContest(contestEntry : ContestEntry) : Q.Promise<boolean> {
        const url = "https://api.fanduel.com/entries/" + contestEntry.id + "/cancel";
        const df = Q.defer<boolean>();

        const options = _.extend({}, this.defaultOptions, {method: "POST"});
        this.makeRawRequest(url, options).then(result => { df.resolve(true); });

        return df.promise;
    }

    public getEntriesForRoster(upcomingRoster : UpcomingRosterRoster) : Q.Promise<ContestEntry[]> {
        const url = "https://api.fanduel.com/users/2965977/grouped-entries?page=1&page_size=250&roster=" + upcomingRoster.id;
        const df = Q.defer<ContestEntry[]>();

        const options = _.extend({}, this.defaultOptions, {method: "GET"});
        this.makeRequest(url, options).then(result => {
            const entries = (<any[]> result.grouped_entries).map(f => {
                const e = new ContestEntry();
                e.id = f["entries"]["ids"][0];
                e._url = f["entries"]["_url"];
                e.prizes = f["entries"]["prizes"];
                return e;
            });

            df.resolve(entries);
        });

        return df.promise;
    }

    private rosterRequest(slate : Slate, contestId : string, lineup : ILineup, isUpdate : boolean) : Q.Promise<ContestEntry[]> {

        let url = "";
        let method = "";

        if(isUpdate){
            url = "https://api.fanduel.com/entries/" + contestId;
            method = "PUT";
        }else{
            url = "https://api.fanduel.com/contests/" + contestId + "/entries";
            method = "POST";
        }

        const roster = lineup.roster.map(f => { return {position: f.position, player: {id: f.player.id}};});
        const requestBody = {
            "entries": [{
                "entry_fee": {"currency": "usd"},
                "roster": {"lineup": roster}
            }]
        };

        const body = JSON.stringify(requestBody);
        const options = _.extend({}, this.defaultOptions, {method: method, body: body});
        options.headers["Content-Type"] = "application/json;charset=utf-8";

        const df = Q.defer<ContestEntry[]>();

        this.makeRequest(url, options).then(result => { df.resolve(result.entries); });

        return df.promise;
    }

    private processXAuthToken(xAuthCookie : string) : Q.Promise<boolean> {
        const result : Q.Deferred<boolean> = Q.defer<boolean>();

        xAuthCookie = xAuthCookie.split(";")[0].replace("X-Auth-Token=", "");

        this.defaultOptions.headers["X-Auth-Token"] = xAuthCookie;
        this.debug("Got xAuthToken = " + xAuthCookie);

        this.hasAuthentication = true;
        this.lastLoginAt = new Date();

        setTimeout(() => {this.hasAuthentication = false;}, 3600 * 1000);

        /*
        this.loadUserData()
            .then(() => { result.resolve(true); })
            .catch((err : any) => { result.reject(err); })
        ;
        */

        result.resolve(true);

        return result.promise;
    }

    public login() : Q.Promise<boolean> {
        const result : Q.Deferred<boolean> = Q.defer<boolean>();
        const loginRequest = _.extend({method: "GET"}, this.defaultOptions, {url: "https://www.fanduel.com/p/login"});

        this.debug(JSON.stringify(loginRequest));

        request(loginRequest, (error : any, response : RequestResponse, body : any) => {

            let phpSessionId = _.find(response.headers["set-cookie"], (v : string) => v.indexOf("PHPSESSID") > -1);
            const xAuthCookie = _.find(response.headers["set-cookie"], (v : string) => v.indexOf("X-Auth-Token") > -1);

            if(phpSessionId){
                phpSessionId = phpSessionId.split(";")[0].replace("PHPSESSID=", "");
            }else{
                throw "phpSessionId undefined";
            }

            const formData = {
                cc_session_id: phpSessionId,
                cc_action: "cca_login",
                cc_failure_url: "https://www.fanduel.com/p/LoginPp",
                cc_success_url: "https://www.fanduel.com/",
                email: this.config.username,
                password: this.config.password,
                checkbox_remember: "1",
                login: "Log in to your account",
            };

            const opt : any  = _.extend({method: "POST"}, this.defaultOptions, {
                url: "https://www.fanduel.com/c/CCAuth",
                formData: formData
            });

            this.debug(JSON.stringify(opt));

            request(opt, (error : any, response : RequestResponse, body : any) => {

                const matches = response.body.match( new RegExp("FanDuel\\.render\\((.+)\\)") );
                const fanduelInfo : any = JSON.parse(matches[1]);

                if(matches.length == 0){
                    this.hasAuthentication = false;
                    return result.reject("Couldn't login! Inavalid credentials?");
                }

                this.defaultOptions.headers["Authorization"] = "Basic " + fanduelInfo.apiClientId;
                result.resolve(true);
            });

        });

        return result.promise;
    }

    public loadUserData() : Q.Promise<boolean> {
        const df : Q.Deferred<boolean> = Q.defer<boolean>();

        this.debug("Loading user data...");

        this.makeRawRequest("https://www.fanduel.com/")
            .then((result) => {
                let re = /<script>([\s\S]+?)<\/script>/ig;
                let matches = result.match(re);
                const targetTag = _.find(matches, (v : string) => v.indexOf("apiClientId") > -1 && v.indexOf("FD.config") > -1);

                if(!targetTag){
                    throw "Could not find user config in fandeul.com";
                }

                re = /id: (\d+?),/;
                matches = re.exec(targetTag);
                this.userInfo.id = matches[1];

                re = /username: '(.+?)',/;
                matches = re.exec(targetTag);
                this.userInfo.username = matches[1];

                re = /apiClientId: '(.+?)',/;
                matches = re.exec(targetTag);
                this.userInfo.apiClientId = matches[1];

                this.defaultOptions["headers"]["Authorization"] = "Basic " + this.userInfo.apiClientId;

                this.debug("Set userdata : " + JSON.stringify(this.userInfo, null, 4));

                df.resolve();
            }, function(){
                df.reject("Error fetching user data");
            });

        return df.promise;
    }

    private makeRawRequest(url : string, options : any = {}) : Q.Promise<any> {
        const result = Q.defer<any>();
        let df : Q.Promise<boolean>;

        if(!this.hasAuthentication){
            df = this.login();
        }else{
            const m = Q.defer<boolean>();
            m.resolve(true);
            df = m.promise;
        }

        const opt = _.extend({method: "GET"}, this.defaultOptions, options, {url: url});

        df.then(function(){
            request(opt, (error : any, response : RequestResponse, body : any) => {
                if(error || response.statusCode >= 400){
                    result.reject( {error: error, response: response, body: body} );
                    return;
                }
                result.resolve(body);
            });
        }).catch((err) => {
            result.reject(err);
        });

        return result.promise;
    }

    private makeRequest(url : string, options : any = {}) : Q.Promise<any> {
        const result = Q.defer<string>();
        this.makeRawRequest(url, options)
            .then((response : any) => result.resolve(JSON.parse(response)))
            .catch(error => {
               console.log(error);
               result.reject(error);
            });
        ;
        return result.promise;
    }

    private initWebSocket() : void {
        this.ws = new WebSocket('wss://websockets.fanduel.com/websocket');
        this.ws.on('open', this.onWebsocketOpen.bind(this));
        this.ws.on('message', this.onWebsocketMessage.bind(this));
    }

    private onWebsocketMessage(data : any) {
        const parsedData : WebsocketUpdate[] = JSON.parse(data);
        this.websocketListeners.forEach(f => {
           f.call(null, parsedData[0]);
        });
    }

    private onWebsocketOpen() {
        const d = new Date();
        const t = d.getTime() - (60000 * 5);
        const startMsg = [{"type":"sub","target":"lobby","lastUpdate":t,"lastRemove":t}];

        this.ws.send( JSON.stringify(startMsg) );
    }

    public subscribeToWebsocket(fn : (message : WebsocketUpdate) => void) : void {
        if(!this.ws){
            this.initWebSocket();
        }

        this.websocketListeners.push(fn);
    }

    private debug(msg : string) {
        if(process.env["DEBUG"]) {
            const d = new Date();
            console.log(d.toString() + ": " + msg);
        }
    }
}