import * as fs from "fs";
import {FanduelConfig} from "../models";
import Fanduel from "../index";
import { expect } from 'chai';
import {dirname} from "path";

console.log( dirname(__filename) + "../auth.json" );

const auth = JSON.parse(fs.readFileSync(dirname(__filename) + "/../auth.json", "utf8"));

describe("auth", () => {
    it("valid credentials", () => {
        const fd = new Fanduel(<FanduelConfig> auth);
        return fd.login().then(result => {
           expect(result).to.equal(true, "Auth succeeded!");
        });
    });
});