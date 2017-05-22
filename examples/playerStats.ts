import * as fs from "fs";
import {dirname} from "path";
import Fanduel from "../index";
import * as Q from "q";
import * as _ from "lodash";
import {FanduelConfig, Player} from "../models";
import * as moment from "moment";

/**
 * Grabs a slate, the available players for that slate, and runs some stats with that list.
 *
 */

const auth = JSON.parse(fs.readFileSync(dirname(__filename) + "/../auth.json", "utf8"));
const fd : Fanduel = new Fanduel(<FanduelConfig> auth);

fd.getAvailableSlates().then(slates => {
   console.log("Target slate: " + slates[0].sport + " (" + slates[0].label + ")");

   fd.getPlayersForSlate(slates[0]).then(playerList => {
       const playerMaxSalary = _.maxBy(playerList, f => f.salary);
       const playerMinSalary = _.minBy(playerList, f => f.salary);

       console.log("Most expensive player: " + playerMaxSalary.last_name + ", " + playerMaxSalary.first_name + " - $" + playerMaxSalary.salary);
       console.log("Cheapest player: " + playerMinSalary.last_name + ", " + playerMinSalary.first_name + " - $" + playerMinSalary.salary);

       const positions = _.uniq(playerList.map(f => f.position));
       console.log("Slate positions: " + positions.join(", "));

       console.log("Average salaries:");
       positions.forEach(pos => {
           const salaries = playerList.filter(f => f.position == pos).map(f => f.salary);
           const sumSalary = _.reduce(salaries, (total, i) => i + total, 0);

           console.log(pos + " $" + (sumSalary / salaries.length).toFixed(1));
       });

       process.exit(0);
   });

});