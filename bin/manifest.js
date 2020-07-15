"use strict";

const manifest = require("../lib/manifest.js");
const Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));
const path = require("path");

const WEBROOT = "www";

const args = process.argv.slice(2);
let artroot = WEBROOT + "/art";
if (args.length) artroot = args[0];

(async () => {
  try {
    const mani = await manifest(artroot, /\.(?:png|jpeg|jpg)$/i, "/art");
    const name = path.join(artroot, "manifest.json");
    await fs.writeFileAsync(name, JSON.stringify(mani, null, 2));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
