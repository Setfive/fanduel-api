"use strict";
exports.__esModule = true;
var _ = require("lodash");
var request = require("request");
var Q = require("q");
var WebSocket = require("ws");
var models_1 = require("./models");
var LineupGenerator_1 = require("./LineupGenerator");
var Fanduel = (function () {
    function Fanduel(config) {
        this.cookieJar = request.jar();
        this.defaultOptions = {
            followRedirect: true,
            followAllRedirects: true,
            jar: this.cookieJar,
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:52.0) Gecko/20100101 Firefox/52.0'
            }
        };
        this.userInfo = new models_1.UserInfo();
        this.hasAuthentication = false;
        this.websocketListeners = [];
        this.config = config;
    }
    Fanduel.prototype.getAvailableContestsForSlateId = function (slate) {
        var result = Q.defer();
        this.makeRequest("https://api.fanduel.com/contests?fixture_list=" + slate.id + "&include_restricted=false")
            .then(function (requestResult) {
            var contestResult = requestResult;
            contestResult.entry_fees = requestResult._meta.entry_fees;
            result.resolve(contestResult);
        });
        return result.promise;
    };
    Fanduel.prototype.getDetailsForSlateId = function (id) {
        var result = Q.defer();
        this.makeRequest("https://api.fanduel.com/fixture-lists/" + id)
            .then(function (requestResult) {
            var intermediateDetails = _.extend(requestResult.fixture_lists[0], { games: requestResult.fixtures });
            intermediateDetails.games = intermediateDetails.games.map(function (f) {
                f.away_team = { team: f["away_team"]["team"]["_members"][0],
                    score: f["away_team"]["score"],
                    sport_specific: f["away_team"]["sport_specific"] };
                f.home_team = { team: f["home_team"]["team"]["_members"][0],
                    score: f["home_team"]["score"],
                    sport_specific: f["home_team"]["sport_specific"] };
                return f;
            });
            result.resolve(intermediateDetails);
        })["catch"](result.reject);
        return result.promise;
    };
    Fanduel.prototype.getDetailsForSlate = function (slate) {
        return this.getDetailsForSlateId(slate.id);
    };
    Fanduel.prototype.getAvailableSlates = function () {
        var result = Q.defer();
        this.makeRequest("https://api.fanduel.com/fixture-lists")
            .then(function (requestResult) {
            var slateResult = requestResult.fixture_lists.map(function (f) {
                f.contests = f.contests.open;
                return f;
            });
            result.resolve(slateResult);
        })["catch"](result.reject);
        return result.promise;
    };
    Fanduel.prototype.getUpcomingRosters = function () {
        var _this = this;
        var result = Q.defer();
        this.login().then(function () {
            _this.makeRequest("https://api.fanduel.com/users/"
                + _this.userInfo.id + "/rosters?page=1&page_size=1000&status=upcoming")
                .then(function (requestResult) {
                var up = new models_1.UpcomingRoster();
                _.assignIn(up, requestResult);
                result.resolve(up);
            })["catch"](result.reject);
        });
        return result.promise;
    };
    Fanduel.prototype.getGamesForSlate = function (slate) {
        var result = Q.defer();
        this.makeRequest("https://api.fanduel.com/fixture-lists/" + slate.id + "/players")
            .then(function (requestResult) {
            result.resolve(requestResult.fixtures);
        })["catch"](result.reject);
        return result.promise;
    };
    Fanduel.prototype.getPlayersForSlateId = function (id) {
        var result = Q.defer();
        this.makeRequest("https://api.fanduel.com/fixture-lists/" + id + "/players")
            .then(function (requestResult) {
            result.resolve(requestResult.players);
        })["catch"](result.reject);
        return result.promise;
    };
    Fanduel.prototype.getPlayersForSlate = function (slate) {
        return this.getPlayersForSlateId(slate.id);
    };
    Fanduel.prototype.createValidLineupForSlate = function (slate) {
        var finalLineupDf = Q.defer();
        var players = this.getPlayersForSlate(slate);
        var slateDetails = this.getDetailsForSlate(slate);
        Q.all([slateDetails, players]).then(function (result) {
            var generator = new LineupGenerator_1.LineupGenerator(result[0], result[1]);
            generator.createValidLineup().then(function (lineupResult) {
                finalLineupDf.resolve(lineupResult);
            });
        });
        return finalLineupDf.promise;
    };
    Fanduel.prototype.createEntryForContest = function (slate, contest, lineup) {
        return this.rosterRequest(slate, contest.id, lineup, false);
    };
    Fanduel.prototype.updateEntryForContest = function (upcomingRoster, lineup) {
        var roster = lineup.roster.map(function (f) { return { position: f.position, player: { id: f.player.id } }; });
        var requestBody = {
            rosters: [{ lineup: roster }]
        };
        var url = "https://api.fanduel.com/users/" + this.userInfo.id + "/rosters/" + upcomingRoster.id + "/transfer-entries";
        var body = JSON.stringify(requestBody);
        var options = _.extend({}, this.defaultOptions, { method: "POST", body: body });
        options.headers["Content-Type"] = "application/json;charset=utf-8";
        var df = Q.defer();
        this.makeRequest(url, options).then(function (result) { df.resolve(true); });
        return df.promise;
    };
    Fanduel.prototype.cancelEntryForContest = function (contestEntry) {
        var url = "https://api.fanduel.com/entries/" + contestEntry.id + "/cancel";
        var df = Q.defer();
        var options = _.extend({}, this.defaultOptions, { method: "POST" });
        this.makeRawRequest(url, options).then(function (result) { df.resolve(true); });
        return df.promise;
    };
    Fanduel.prototype.getEntriesForRoster = function (upcomingRoster) {
        var url = "https://api.fanduel.com/users/2965977/grouped-entries?page=1&page_size=250&roster=" + upcomingRoster.id;
        var df = Q.defer();
        var options = _.extend({}, this.defaultOptions, { method: "GET" });
        this.makeRequest(url, options).then(function (result) {
            var entries = result.grouped_entries.map(function (f) {
                var e = new models_1.ContestEntry();
                e.id = f["entries"]["ids"][0];
                e._url = f["entries"]["_url"];
                e.prizes = f["entries"]["prizes"];
                return e;
            });
            df.resolve(entries);
        });
        return df.promise;
    };
    Fanduel.prototype.rosterRequest = function (slate, contestId, lineup, isUpdate) {
        var url = "";
        var method = "";
        if (isUpdate) {
            url = "https://api.fanduel.com/entries/" + contestId;
            method = "PUT";
        }
        else {
            url = "https://api.fanduel.com/contests/" + contestId + "/entries";
            method = "POST";
        }
        var roster = lineup.roster.map(function (f) { return { position: f.position, player: { id: f.player.id } }; });
        var requestBody = {
            "entries": [{
                    "entry_fee": { "currency": "usd" },
                    "roster": { "lineup": roster }
                }]
        };
        var body = JSON.stringify(requestBody);
        var options = _.extend({}, this.defaultOptions, { method: method, body: body });
        options.headers["Content-Type"] = "application/json;charset=utf-8";
        var df = Q.defer();
        this.makeRequest(url, options).then(function (result) { df.resolve(result.entries); });
        return df.promise;
    };
    Fanduel.prototype.processXAuthToken = function (xAuthCookie) {
        var _this = this;
        var result = Q.defer();
        xAuthCookie = xAuthCookie.split(";")[0].replace("X-Auth-Token=", "");
        this.defaultOptions.headers["X-Auth-Token"] = xAuthCookie;
        this.hasAuthentication = true;
        this.lastLoginAt = new Date();
        this.debug("Got xAuthToken = " + xAuthCookie);
        setTimeout(function () { _this.hasAuthentication = false; }, 3600 * 1000);
        this.loadUserData()
            .then(function () { result.resolve(true); })["catch"](function (err) { result.reject(err); });
        return result.promise;
    };
    Fanduel.prototype.login = function () {
        var _this = this;
        var result = Q.defer();
        var loginRequest = _.extend({ method: "GET" }, this.defaultOptions, { url: "https://www.fanduel.com/p/login" });
        this.debug(JSON.stringify(loginRequest));
        request(loginRequest, function (error, response, body) {
            var phpSessionId = _.find(response.headers["set-cookie"], function (v) { return v.indexOf("PHPSESSID") > -1; });
            var xAuthCookie = _.find(response.headers["set-cookie"], function (v) { return v.indexOf("X-Auth-Token") > -1; });
            if (xAuthCookie) {
                return _this.processXAuthToken(xAuthCookie)
                    .then(function (xAuthResult) { return result.resolve(xAuthResult); })["catch"](function (xAuthResult) { return result.reject(xAuthResult); });
            }
            if (phpSessionId) {
                phpSessionId = phpSessionId.split(";")[0].replace("PHPSESSID=", "");
            }
            else {
                throw "phpSessionId undefined";
            }
            var formData = {
                cc_session_id: phpSessionId,
                cc_action: "cca_login",
                cc_failure_url: "https://www.fanduel.com/p/LoginPp",
                cc_success_url: "https://www.fanduel.com/",
                email: _this.config.username,
                password: _this.config.password,
                checkbox_remember: "1",
                login: "Log in to your account"
            };
            var opt = _.extend({ method: "POST" }, _this.defaultOptions, {
                url: "https://www.fanduel.com/c/CCAuth",
                formData: formData
            });
            _this.debug(JSON.stringify(opt));
            request(opt, function (error, response, body) {
                var xAuthCookie = _.find(response.headers["set-cookie"], function (v) { return v.indexOf("X-Auth-Token") > -1; });
                if (xAuthCookie) {
                    return _this.processXAuthToken(xAuthCookie)
                        .then(function (xAuthResult) { return result.resolve(xAuthResult); })["catch"](function (xAuthResult) { return result.reject(xAuthResult); });
                }
                else {
                    _this.hasAuthentication = false;
                    result.reject("Couldn't login! Inavalid credentials?");
                }
            });
        });
        return result.promise;
    };
    Fanduel.prototype.loadUserData = function () {
        var _this = this;
        var df = Q.defer();
        this.debug("Loading user data...");
        this.makeRawRequest("https://www.fanduel.com/")
            .then(function (result) {
            var re = /<script>([\s\S]+?)<\/script>/ig;
            var matches = result.match(re);
            var targetTag = _.find(matches, function (v) { return v.indexOf("apiClientId") > -1 && v.indexOf("FD.config") > -1; });
            if (!targetTag) {
                throw "Could not find user config in fandeul.com";
            }
            re = /id: (\d+?),/;
            matches = re.exec(targetTag);
            _this.userInfo.id = matches[1];
            re = /username: '(.+?)',/;
            matches = re.exec(targetTag);
            _this.userInfo.username = matches[1];
            re = /apiClientId: '(.+?)',/;
            matches = re.exec(targetTag);
            _this.userInfo.apiClientId = matches[1];
            _this.defaultOptions["headers"]["Authorization"] = "Basic " + _this.userInfo.apiClientId;
            _this.debug("Set userdata : " + JSON.stringify(_this.userInfo, null, 4));
            df.resolve();
        }, function () {
            df.reject("Error fetching user data");
        });
        return df.promise;
    };
    Fanduel.prototype.makeRawRequest = function (url, options) {
        if (options === void 0) { options = {}; }
        var result = Q.defer();
        var df;
        if (!this.hasAuthentication) {
            df = this.login();
        }
        else {
            var m = Q.defer();
            m.resolve(true);
            df = m.promise;
        }
        var opt = _.extend({ method: "GET" }, this.defaultOptions, options, { url: url });
        df.then(function () {
            request(opt, function (error, response, body) {
                if (error || response.statusCode >= 400) {
                    result.reject({ error: error, response: response, body: body });
                    return;
                }
                result.resolve(body);
            });
        })["catch"](function (err) {
            result.reject(err);
        });
        return result.promise;
    };
    Fanduel.prototype.makeRequest = function (url, options) {
        if (options === void 0) { options = {}; }
        var result = Q.defer();
        this.makeRawRequest(url, options)
            .then(function (response) { return result.resolve(JSON.parse(response)); })["catch"](function (error) {
            console.log(error);
            result.reject(error);
        });
        ;
        return result.promise;
    };
    Fanduel.prototype.initWebSocket = function () {
        this.ws = new WebSocket('wss://websockets.fanduel.com/websocket');
        this.ws.on('open', this.onWebsocketOpen.bind(this));
        this.ws.on('message', this.onWebsocketMessage.bind(this));
    };
    Fanduel.prototype.onWebsocketMessage = function (data) {
        var parsedData = JSON.parse(data);
        console.log(parsedData);
    };
    Fanduel.prototype.onWebsocketOpen = function () {
        var d = new Date();
        var t = d.getTime() - (60000 * 5);
        var startMsg = [{ "type": "sub", "target": "lobby", "lastUpdate": t, "lastRemove": t }];
        this.ws.send(JSON.stringify(startMsg));
    };
    Fanduel.prototype.subscribeToWebsocket = function (fn) {
        if (!this.ws) {
            this.initWebSocket();
        }
        this.websocketListeners.push(fn);
    };
    Fanduel.prototype.debug = function (msg) {
        if (process.env["DEBUG"]) {
            var d = new Date();
            console.log(d.toString() + ": " + msg);
        }
    };
    return Fanduel;
}());
exports["default"] = Fanduel;
