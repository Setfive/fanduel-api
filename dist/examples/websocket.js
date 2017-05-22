"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path_1 = require("path");
const index_1 = require("../index");
const _ = require("lodash");
/**
 * This just listens to the Fanduel "lobby" websocket for updates.
 * It then filters for "Head to Head" contests with an entry fee less than $5.
 */
const auth = JSON.parse(fs.readFileSync(path_1.dirname(__filename) + "/../auth.json", "utf8"));
const fd = new index_1.default(auth);
fd.subscribeToWebsocket((data) => {
    const targetAdditions = _.filter(data.data.additions, f => f.entryFee < 5 && f.contestType == "H2H");
    console.log("# target additions: " + targetAdditions.length);
});
