## Unofficial Fanduel API

Have you ever wanted programmatic access to Fanduel.com? 
Maybe to automatically import player data into your daily fantasy sports model. 
Or automatically contests that match a set of criteria. Well now you can.

This is a TypeScript library which allows you to access the REST 
endpoints that Fanduel.com itself uses. The library enables you to perform 
all the core functionality of Fanduel programmatically.

Note: This is definitely against the Fanduel ToS so be careful what account you use it with. 

## Demo
![](https://raw.githubusercontent.com/Setfive/fanduel-api/master/demo.gif)

## Getting Started

* First, check out the repository somewhere
* Then you should be able to create a nodejs script containing:

```
"use strict";

const Fanduel = require("./fanduel-api").default;
const auth = {username: "your fanduel userame", password: "your fanduel password"};

const fd = new Fanduel(auth);

fd.getAvailableSlates().then(slates => {
    console.log(slates);
    process.exit(0);
});
```

Replacing the placeholders with your Fanduel credentials.

Run it, and you'll see the currently available slates output to your console.

Pretty cool huh?

## Examples

Check out the [https://github.com/Setfive/fanduel-api/tree/master/examples](https://github.com/Setfive/fanduel-api/tree/master/examples) 
folder for sample code around what can be done with this library.

## Things to note

In no particular order:

* As noted above, using this is explicitly against the Fanduel ToS. You have been warned (twice).
* I created TypeScript classes to mirror the data that comes back from Fanduel. Those are in [https://github.com/Setfive/fanduel-api/blob/master/models.ts](https://github.com/Setfive/fanduel-api/blob/master/models.ts)
* I tried to use those types to make it clear how library's code can be stitched together.
* Fanduel uses a Websocket to power the "Lobby", it streams back updates which your browser normally parses into the UI.
* [https://github.com/Setfive/fanduel-api/blob/master/examples/websocket.ts](https://github.com/Setfive/fanduel-api/blob/master/examples/websocket.ts) has an example for how you can listen in on that
* [https://github.com/Setfive/fanduel-api/blob/master/LineupGenerator.ts](https://github.com/Setfive/fanduel-api/blob/master/LineupGenerator.ts) is a very naivete line up generator which performs a brute force search looking for a line up with the highest projected Fanduel points.  
* And no, unfortunately I haven't used this to build a bot to mint money on Fanduel...yet ;)

## Development

This is written in TypeScript so you'll definitely 
need TypeScript (http://www.typescriptlang.org/index.html#download-links) installed. 
If you want to run TypeScript without compiling it you'll 
also need ts-node (https://github.com/TypeStrong/ts-node). 
I'd recommend ts-node since it tightens the development feedback loop.

To build the JavaScript, just run "tsc" in the root folder 
and it'll use the tsconfig.json settings to build the files in dist/

## Documentation

There really isn't any. But there are auto generated doxygen style class definitions at
[http://htmlpreview.github.io/?https://github.com/Setfive/fanduel-api/blob/master/docs/index.html](https://github.com/Setfive/fanduel-api/blob/master/docs/index.html)

Those were generated with [http://typedoc.org/](TypeDoc) by running:
```
typedoc --out docs/ --target ES5 --exclude tests/ index.ts models.ts LineupGenerator.ts
```

From the root of the project.