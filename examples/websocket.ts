import * as fs from "fs";
import {dirname} from "path";
import Fanduel from "../Fanduel";
import * as Q from "q";
import * as _ from "lodash";
import {FanduelConfig} from "../models";

/**
 * This just listens to the Fanduel "lobby" websocket for updates.
 * It then filters for "Head to Head" contests with an entry fee less than $5.
 */

const auth = JSON.parse(fs.readFileSync(dirname(__filename) + "/../auth.json", "utf8"));
const fd : Fanduel = new Fanduel(<FanduelConfig> auth);

fd.subscribeToWebsocket((data) => {
    const targetAdditions = _.filter(data.data.additions, f => f.entryFee < 5 && f.contestType == "H2H");
    console.log("# target additions: " + targetAdditions.length);
});