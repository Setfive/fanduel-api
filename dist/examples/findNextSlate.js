"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path_1 = require("path");
const Fanduel_1 = require("../Fanduel");
const _ = require("lodash");
const moment = require("moment");
/**
 * Here we'll grab the available slates from Fanduel and output the one that's starting the soonest.
 *
 */
const auth = JSON.parse(fs.readFileSync(path_1.dirname(__filename) + "/../auth.json", "utf8"));
const fd = new Fanduel_1.default(auth);
fd.getAvailableSlates().then(slates => {
    const sorted = _.sortBy(slates, f => {
        const sd = moment(f.start_date);
        return sd.unix();
    });
    if (sorted.length == 0) {
        console.log("Currently no available slates.");
        process.exit(0);
    }
    console.log("Soonest slate is:");
    console.log(sorted[0]);
    process.exit(0);
});
