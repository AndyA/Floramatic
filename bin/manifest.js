"use strict";

var manifest = require('../lib/manifest.js');
var fs = require('fs');
var path = require('path');

var WEBROOT = 'www';

var args = process.argv.slice(2);
var artroot = WEBROOT + '/art';
if (args.length) artroot = args[0];

manifest(artroot, /\.(?:png|jpeg|jpg)$/i, '/art').then(function(mani) {
  var out = fs.createWriteStream(path.join(artroot, 'manifest.json'));
  out.write(JSON.stringify(mani, null, 2));
  out.end();
});
