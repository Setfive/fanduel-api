import {CookieJar, Headers} from "request";

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