import * as fs from "fs";
import {FanduelConfig, Lineup, Sport, UpcomingRoster} from "../models";
import Fanduel from "../index";
import { expect } from 'chai';
import {dirname} from "path";
import * as Q from "q";
import * as _ from "lodash";

const auth = JSON.parse(fs.readFileSync(dirname(__filename) + "/../auth.json", "utf8"));

let fd : Fanduel;

before(() => {
    fd = new Fanduel(<FanduelConfig> auth);
});

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

describe("info", () => {

    xit("slates", () => {
        return fd.getAvailableSlates().then(result => {
           expect(result).to.be.instanceof(Array);
        });
    });

    xit("slate details", () => {
        const df = Q.defer<boolean>();

        fd.getAvailableSlates().then(result => {
           fd.getDetailsForSlateId(result[0])
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
            fd.getAvailableContestsForSlateId(result[0])
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

});

describe("lineups", () => {

    xit("generate valid lineup", () => {
        const df = Q.defer<boolean>();

        fd.getAvailableSlates().then(result => {
            fd.createValidLineupForSlate(result[0]).then(lineup => {
                expect(lineup).to.be.instanceof(Lineup);
                df.resolve(true);
            });
        });

        return df.promise;
    });

    xit("enter contest", () => {
        const df = Q.defer<boolean>();

        fd.getAvailableSlates().then(result => {
            const slate = result[0];

            const autoLineup = fd.createValidLineupForSlate(slate);
            const contestResult = fd.getAvailableContestsForSlateId(slate);

            Q.all([contestResult, autoLineup]).then(results => {
                const contest = _.find(results[0].contests, c => c.entry_fee == 1);
                fd.createEntryForContest(slate, contest, results[1]).then(createdContests => {
                    expect(createdContests).to.be.instanceof(Array);
                    df.resolve(true);
                });
            });

        });

        return df.promise;
    });

    it("list my upcoming", () => {
        return fd.getUpcomingRosters().then(result => {
            expect(result).to.be.instanceof(UpcomingRoster);
        });
    });

});