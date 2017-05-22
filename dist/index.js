"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const request = require("request");
const Q = require("q");
const WebSocket = require("ws");
const models_1 = require("./models");
const LineupGenerator_1 = require("./LineupGenerator");
class Fanduel {
    constructor(config) {
        this.cookieJar = request.jar();
        this.defaultOptions = {
            followRedirect: true,
            followAllRedirects: true,
            jar: this.cookieJar,
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:52.0) Gecko/20100101 Firefox/52.0',
            }
        };
        this.userInfo = new models_1.UserInfo();
        this.hasAuthentication = false;
        this.websocketListeners = [];
        this.config = config;
    }
    getAvailableContestsForSlateId(slate) {
        const result = Q.defer();
        this.makeRequest("https://api.fanduel.com/contests?fixture_list=" + slate.id + "&include_restricted=false")
            .then(requestResult => {
            const contestResult = requestResult;
            contestResult.entry_fees = requestResult._meta.entry_fees;
            result.resolve(contestResult);
        });
        return result.promise;
    }
    getDetailsForSlateId(id) {
        const result = Q.defer();
        this.makeRequest("https://api.fanduel.com/fixture-lists/" + id)
            .then(requestResult => {
            const intermediateDetails = _.extend(requestResult.fixture_lists[0], { games: requestResult.fixtures });
            intermediateDetails.games = intermediateDetails.games.map(f => {
                f.away_team = { team: f["away_team"]["team"]["_members"][0],
                    score: f["away_team"]["score"],
                    sport_specific: f["away_team"]["sport_specific"] };
                f.home_team = { team: f["home_team"]["team"]["_members"][0],
                    score: f["home_team"]["score"],
                    sport_specific: f["home_team"]["sport_specific"] };
                return f;
            });
            result.resolve(intermediateDetails);
        })
            .catch(result.reject);
        return result.promise;
    }
    getDetailsForSlate(slate) {
        return this.getDetailsForSlateId(slate.id);
    }
    getAvailableSlates() {
        const result = Q.defer();
        this.makeRequest("https://api.fanduel.com/fixture-lists")
            .then(requestResult => {
            const slateResult = requestResult.fixture_lists.map(f => {
                f.contests = f.contests.open;
                return f;
            });
            result.resolve(slateResult);
        })
            .catch(result.reject);
        return result.promise;
    }
    getUpcomingRosters() {
        const result = Q.defer();
        this.login().then(() => {
            this.makeRequest("https://api.fanduel.com/users/"
                + this.userInfo.id + "/rosters?page=1&page_size=1000&status=upcoming")
                .then(requestResult => {
                const up = new models_1.UpcomingRoster();
                _.assignIn(up, requestResult);
                result.resolve(up);
            })
                .catch(result.reject);
        });
        return result.promise;
    }
    getGamesForSlate(slate) {
        const result = Q.defer();
        this.makeRequest("https://api.fanduel.com/fixture-lists/" + slate.id + "/players")
            .then(requestResult => {
            result.resolve(requestResult.fixtures);
        })
            .catch(result.reject);
        return result.promise;
    }
    getPlayersForSlateId(id) {
        const result = Q.defer();
        this.makeRequest("https://api.fanduel.com/fixture-lists/" + id + "/players")
            .then(requestResult => {
            result.resolve(requestResult.players);
        })
            .catch(result.reject);
        return result.promise;
    }
    getPlayersForSlate(slate) {
        return this.getPlayersForSlateId(slate.id);
    }
    createValidLineupForSlate(slate) {
        const finalLineupDf = Q.defer();
        const players = this.getPlayersForSlate(slate);
        const slateDetails = this.getDetailsForSlate(slate);
        Q.all([slateDetails, players]).then((result) => {
            const generator = new LineupGenerator_1.LineupGenerator(result[0], result[1]);
            generator.createValidLineup().then(lineupResult => {
                finalLineupDf.resolve(lineupResult);
            });
        });
        return finalLineupDf.promise;
    }
    createEntryForContest(slate, contest, lineup) {
        return this.rosterRequest(slate, contest.id, lineup, false);
    }
    updateEntryForContest(upcomingRoster, lineup) {
        const roster = lineup.roster.map(f => { return { position: f.position, player: { id: f.player.id } }; });
        const requestBody = {
            rosters: [{ lineup: roster }]
        };
        const url = "https://api.fanduel.com/users/" + this.userInfo.id + "/rosters/" + upcomingRoster.id + "/transfer-entries";
        const body = JSON.stringify(requestBody);
        const options = _.extend({}, this.defaultOptions, { method: "POST", body: body });
        options.headers["Content-Type"] = "application/json;charset=utf-8";
        const df = Q.defer();
        this.makeRequest(url, options).then(result => { df.resolve(true); });
        return df.promise;
    }
    cancelEntryForContest(contestEntry) {
        const url = "https://api.fanduel.com/entries/" + contestEntry.id + "/cancel";
        const df = Q.defer();
        const options = _.extend({}, this.defaultOptions, { method: "POST" });
        this.makeRawRequest(url, options).then(result => { df.resolve(true); });
        return df.promise;
    }
    getEntriesForRoster(upcomingRoster) {
        const url = "https://api.fanduel.com/users/2965977/grouped-entries?page=1&page_size=250&roster=" + upcomingRoster.id;
        const df = Q.defer();
        const options = _.extend({}, this.defaultOptions, { method: "GET" });
        this.makeRequest(url, options).then(result => {
            const entries = result.grouped_entries.map(f => {
                const e = new models_1.ContestEntry();
                e.id = f["entries"]["ids"][0];
                e._url = f["entries"]["_url"];
                e.prizes = f["entries"]["prizes"];
                return e;
            });
            df.resolve(entries);
        });
        return df.promise;
    }
    rosterRequest(slate, contestId, lineup, isUpdate) {
        let url = "";
        let method = "";
        if (isUpdate) {
            url = "https://api.fanduel.com/entries/" + contestId;
            method = "PUT";
        }
        else {
            url = "https://api.fanduel.com/contests/" + contestId + "/entries";
            method = "POST";
        }
        const roster = lineup.roster.map(f => { return { position: f.position, player: { id: f.player.id } }; });
        const requestBody = {
            "entries": [{
                    "entry_fee": { "currency": "usd" },
                    "roster": { "lineup": roster }
                }]
        };
        const body = JSON.stringify(requestBody);
        const options = _.extend({}, this.defaultOptions, { method: method, body: body });
        options.headers["Content-Type"] = "application/json;charset=utf-8";
        const df = Q.defer();
        this.makeRequest(url, options).then(result => { df.resolve(result.entries); });
        return df.promise;
    }
    processXAuthToken(xAuthCookie) {
        const result = Q.defer();
        xAuthCookie = xAuthCookie.split(";")[0].replace("X-Auth-Token=", "");
        this.defaultOptions.headers["X-Auth-Token"] = xAuthCookie;
        this.hasAuthentication = true;
        this.lastLoginAt = new Date();
        this.debug("Got xAuthToken = " + xAuthCookie);
        setTimeout(() => { this.hasAuthentication = false; }, 3600 * 1000);
        this.loadUserData()
            .then(() => { result.resolve(true); })
            .catch((err) => { result.reject(err); });
        return result.promise;
    }
    login() {
        const result = Q.defer();
        const loginRequest = _.extend({ method: "GET" }, this.defaultOptions, { url: "https://www.fanduel.com/p/login" });
        this.debug(JSON.stringify(loginRequest));
        request(loginRequest, (error, response, body) => {
            let phpSessionId = _.find(response.headers["set-cookie"], (v) => v.indexOf("PHPSESSID") > -1);
            const xAuthCookie = _.find(response.headers["set-cookie"], (v) => v.indexOf("X-Auth-Token") > -1);
            if (xAuthCookie) {
                return this.processXAuthToken(xAuthCookie)
                    .then((xAuthResult) => result.resolve(xAuthResult))
                    .catch((xAuthResult) => result.reject(xAuthResult));
            }
            if (phpSessionId) {
                phpSessionId = phpSessionId.split(";")[0].replace("PHPSESSID=", "");
            }
            else {
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
                login: "Log in to your account"
            };
            const opt = _.extend({ method: "POST" }, this.defaultOptions, {
                url: "https://www.fanduel.com/c/CCAuth",
                formData: formData,
            });
            this.debug(JSON.stringify(opt));
            request(opt, (error, response, body) => {
                const xAuthCookie = _.find(response.headers["set-cookie"], (v) => v.indexOf("X-Auth-Token") > -1);
                if (xAuthCookie) {
                    return this.processXAuthToken(xAuthCookie)
                        .then((xAuthResult) => result.resolve(xAuthResult))
                        .catch((xAuthResult) => result.reject(xAuthResult));
                }
                else {
                    this.hasAuthentication = false;
                    result.reject("Couldn't login! Inavalid credentials?");
                }
            });
        });
        return result.promise;
    }
    loadUserData() {
        const df = Q.defer();
        this.debug("Loading user data...");
        this.makeRawRequest("https://www.fanduel.com/")
            .then((result) => {
            let re = /<script>([\s\S]+?)<\/script>/ig;
            let matches = result.match(re);
            const targetTag = _.find(matches, (v) => v.indexOf("apiClientId") > -1 && v.indexOf("FD.config") > -1);
            if (!targetTag) {
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
        }, function () {
            df.reject("Error fetching user data");
        });
        return df.promise;
    }
    makeRawRequest(url, options = {}) {
        const result = Q.defer();
        let df;
        if (!this.hasAuthentication) {
            df = this.login();
        }
        else {
            const m = Q.defer();
            m.resolve(true);
            df = m.promise;
        }
        const opt = _.extend({ method: "GET" }, this.defaultOptions, options, { url: url });
        df.then(function () {
            request(opt, (error, response, body) => {
                if (error || response.statusCode >= 400) {
                    result.reject({ error: error, response: response, body: body });
                    return;
                }
                result.resolve(body);
            });
        }).catch((err) => {
            result.reject(err);
        });
        return result.promise;
    }
    makeRequest(url, options = {}) {
        const result = Q.defer();
        this.makeRawRequest(url, options)
            .then((response) => result.resolve(JSON.parse(response)))
            .catch(error => {
            console.log(error);
            result.reject(error);
        });
        ;
        return result.promise;
    }
    initWebSocket() {
        this.ws = new WebSocket('wss://websockets.fanduel.com/websocket');
        this.ws.on('open', this.onWebsocketOpen.bind(this));
        this.ws.on('message', this.onWebsocketMessage.bind(this));
    }
    onWebsocketMessage(data) {
        const parsedData = JSON.parse(data);
        this.websocketListeners.forEach(f => {
            f.call(null, parsedData[0]);
        });
    }
    onWebsocketOpen() {
        const d = new Date();
        const t = d.getTime() - (60000 * 5);
        const startMsg = [{ "type": "sub", "target": "lobby", "lastUpdate": t, "lastRemove": t }];
        this.ws.send(JSON.stringify(startMsg));
    }
    subscribeToWebsocket(fn) {
        if (!this.ws) {
            this.initWebSocket();
        }
        this.websocketListeners.push(fn);
    }
    debug(msg) {
        if (process.env["DEBUG"]) {
            const d = new Date();
            console.log(d.toString() + ": " + msg);
        }
    }
}
exports.default = Fanduel;
