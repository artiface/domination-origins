"use strict";

const path = require("path");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const { startCreating, buildSetup } = require(path.join(
  basePath,
  "/src/main.js"
));

const argsv = process.argv.slice(2);
const tokenId = parseInt(argsv[0]);
const onlyStarter = argsv[1] === 'starter';
(() => {
  buildSetup();
  startCreating(tokenId, onlyStarter);
})();
