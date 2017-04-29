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
    contests : SlateContest;
    players : Linked;
}