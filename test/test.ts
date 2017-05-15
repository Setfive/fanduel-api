import * as fs from "fs";
import {FanduelConfig, Lineup, Sport} from "../models";
import Fanduel from "../index";
import { expect } from 'chai';
import {dirname} from "path";
import * as Q from "q";

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

    xit("slate details", () => {
        const df = Q.defer<boolean>();

        fd.getAvailableSlates().then(result => {
           fd.getDetailsForSlateId(result[0].id)
             .then(slateDetails => {
                 expect(slateDetails).to.be.any;
                 df.resolve(true);
           })
             .catch(reason => {
                 console.log(reason);
                 expect(false).to.equal(true);
             })
           ;
        });

        return df.promise;
    });

    xit("slate contests", () => {
        const df = Q.defer<boolean>();

        fd.getAvailableSlates().then(result => {
            fd.getAvailableContestsForSlateId(result[0].id)
              .then(contestDetails => {
                  expect(contestDetails).to.be.any;
                  df.resolve(true);
              })
              .catch(reason => {
                  console.log(reason);
                  expect(false).to.equal(true);
              });
        });

        return df.promise;
    });

    xit("players for slate", () => {
        const df = Q.defer<boolean>();

        fd.getAvailableSlates().then(result => {
            fd.getPlayersForSlate(result[0]).then(slatePlayers => {
                expect(slatePlayers).to.be.instanceof(Array);
            });
        });

        return df.promise;
    });

    xit("games for slate", () => {
        const df = Q.defer<boolean>();

        fd.getAvailableSlates().then(result => {
            fd.getGamesForSlate(result[0]).then(slateGames => {
                expect(slateGames).to.be.instanceof(Array);
            });
        });

        return df.promise;
    });

    it("generate valid lineup", () => {
        const df = Q.defer<boolean>();

        fd.getAvailableSlates().then(result => {
            fd.createValidLineupForSlate(result[0]).then(lineup => {
                console.log(lineup);
                expect(lineup).to.be.instanceof(Lineup);
            });
        });

        return df.promise;
    });

});