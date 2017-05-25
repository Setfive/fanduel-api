import * as fs from "fs";
import {dirname} from "path";
import Fanduel from "../Fanduel";
import * as Q from "q";
import * as _ from "lodash";
import {FanduelConfig} from "../models";
import * as moment from "moment";

/**
 * Here we'll grab the available slates from Fanduel and output the one that's starting the soonest.
 *
 */

const auth = JSON.parse(fs.readFileSync(dirname(__filename) + "/../auth.json", "utf8"));
const fd : Fanduel = new Fanduel(<FanduelConfig> auth);

fd.getAvailableSlates().then(slates => {
    const sorted = _.sortBy(slates, f => {
       const sd = moment(f.start_date);
       return sd.unix();
    });

    if(sorted.length == 0){
        console.log("Currently no available slates.");
        process.exit(0);
    }

    console.log("Soonest slate is:")
    console.log(sorted[0]);
    process.exit(0);
});