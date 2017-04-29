import * as fs from "fs";
import {FanduelConfig} from "../models";
import Fanduel from "../index";
import { expect } from 'chai';
import {dirname} from "path";
import * as Q from "q";

console.log( dirname(__filename) + "../auth.json" );

const auth = JSON.parse(fs.readFileSync(dirname(__filename) + "/../auth.json", "utf8"));

describe("auth", () => {

    xit("valid credentials", () => {
        const fd = new Fanduel(<FanduelConfig> auth);
        return fd.login().then(result => {
           expect(result).to.equal(true, "Auth succeeded!");
        });
    });

    xit("invalid credentials", () => {
        auth.password = "badpassword";
        const fd = new Fanduel(<FanduelConfig> auth);
        return fd.login()
                  .then()
                  .catch(result => {
                      expect(result).to.equal("Couldn't login! Inavalid credentials?");
                  });
    });

});

let fd : Fanduel;

before(() => {
    fd = new Fanduel(<FanduelConfig> auth);
});

describe("info", () => {

    xit("slates", () => {
        return fd.getAvailableSlates().then(result => {
           expect(result).to.be.instanceof(Array);
        });
    });

    it("slate details", () => {
        const df = Q.defer<boolean>();

        fd.getAvailableSlates().then(result => {
           fd.getDetailsForSlateId(result[0].id).then(slateDetails => {
               expect(slateDetails).to.null("null");
               df.resolve(true);
           });
        });

        return df.promise;
    });

});