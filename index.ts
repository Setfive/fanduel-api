import * as _ from "lodash";
import * as request from "request";
import * as Q from "q";
import {FanduelConfig, IDefaultOptions, Slate, SlateDetails, UserInfo} from "./models";
import {CookieJar, RequestResponse} from "request";
import {log} from "util";

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

    constructor(config : FanduelConfig){
        this.config = config;
    }

    public getDetailsForSlateId(slateId : string) : Q.Promise<SlateDetails> {
        const result : Q.Deferred<SlateDetails> = Q.defer<SlateDetails>();

        this.makeRequest("https://api.fanduel.com/fixture-lists/" + slateId)
            .then(requestResult => {
                const intermediateDetails : any = _.extend(requestResult.fixture_lists[0], {games: requestResult.fixtures});
                intermediateDetails.games = (<any[]> intermediateDetails.games).map(f => {
                   f.away_team = {team: f["away_team"]["team"]["_members"][0],
                                  score: f["away_team"]["score"],
                                  sport_specific: f["away_team"]["sport_specific"]};

                    f.home_team = {team: f["home_team"]["team"]["_members"][0],
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

    private processXAuthToken(xAuthCookie : string) : Q.Promise<boolean> {
        const result : Q.Deferred<boolean> = Q.defer<boolean>();

        xAuthCookie = xAuthCookie.split(";")[0].replace("X-Auth-Token=", "");
        this.defaultOptions.headers["X-Auth-Token"] = xAuthCookie;
        this.hasAuthentication = true;
        this.lastLoginAt = new Date();

        this.debug("Got xAuthToken = " + xAuthCookie);

        setTimeout(() => {this.hasAuthentication = false;}, 3600 * 1000);

        this.loadUserData()
            .then(() => { result.resolve(true); })
            .catch((err : any) => { result.reject(err); })
        ;

        return result.promise;
    }

    public login() : Q.Promise<boolean> {
        const result : Q.Deferred<boolean> = Q.defer<boolean>();
        const loginRequest = _.extend({method: "GET"}, this.defaultOptions, {url: "https://www.fanduel.com/p/login"});

        this.debug(JSON.stringify(loginRequest));

        request(loginRequest, (error : any, response : RequestResponse, body : any) => {

            let phpSessionId = _.find(response.headers["set-cookie"], (v : string) => v.indexOf("PHPSESSID") > -1);
            const xAuthCookie = _.find(response.headers["set-cookie"], (v : string) => v.indexOf("X-Auth-Token") > -1);

            if (xAuthCookie) {
                return this.processXAuthToken(xAuthCookie)
                          .then((xAuthResult) => result.resolve(xAuthResult))
                          .catch((xAuthResult) => result.reject(xAuthResult));
            }

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
                login: "Log in to your account"
            };

            const opt = _.extend({method: "POST"}, this.defaultOptions, {
                url: "https://www.fanduel.com/c/CCAuth",
                formData: formData,
            });

            this.debug(JSON.stringify(opt));

            request(opt, (error : any, response : RequestResponse, body : any) => {
                const xAuthCookie = _.find(response.headers["set-cookie"], (v : string) => v.indexOf("X-Auth-Token") > -1);
                if (xAuthCookie) {
                    return this.processXAuthToken(xAuthCookie)
                               .then((xAuthResult) => result.resolve(xAuthResult))
                               .catch((xAuthResult) => result.reject(xAuthResult));
                }else{
                    this.hasAuthentication = false;
                    result.reject("Couldn't login! Inavalid credentials?");
                }
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
            .then((response : any) => result.resolve(JSON.parse(response)));
        return result.promise;
    }

    private debug(msg : string) {
        if(process.env["DEBUG"]) {
            const d = new Date();
            console.log(d.toString() + ": " + msg);
        }
    }
}