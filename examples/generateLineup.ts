import * as fs from "fs";
import {dirname} from "path";
import Fanduel from "../index";
import * as Q from "q";
import * as _ from "lodash";
import {FanduelConfig, Player} from "../models";
import * as moment from "moment";

/**
 * Grabs a slate and generates a lineup optimized on projected fanduel points for that slate.
 *
 */

const auth = JSON.parse(fs.readFileSync(dirname(__filename) + "/../auth.json", "utf8"));
const fd : Fanduel = new Fanduel(<FanduelConfig> auth);

fd.getAvailableSlates().then(slates => {
    console.log("Target slate: " + slates[0].sport + " (" + slates[0].label + ")");
    fd.createValidLineupForSlate(slates[0]).then(lineup => {
        console.log("Your lineup:");
        console.log(lineup);
    });
});
