"use strict";
exports.__esModule = true;
var fs = require("fs");
var path_1 = require("path");
var index_1 = require("../index");
var auth = JSON.parse(fs.readFileSync(path_1.dirname(__filename) + "/../auth.json", "utf8"));
var fd = new index_1["default"](auth);
fd.subscribeToWebsocket();
