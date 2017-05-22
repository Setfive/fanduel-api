"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path_1 = require("path");
const index_1 = require("../index");
/**
 * Grabs a slate and generates a lineup optimized on projected fanduel points for that slate.
 *
 */
const auth = JSON.parse(fs.readFileSync(path_1.dirname(__filename) + "/../auth.json", "utf8"));
const fd = new index_1.default(auth);
fd.getAvailableSlates().then(slates => {
    console.log("Target slate: " + slates[0].sport + " (" + slates[0].label + ")");
    fd.createValidLineupForSlate(slates[0]).then(lineup => {
        console.log("Your lineup:");
        console.log(lineup);
    });
});
