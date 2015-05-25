"use strict";

module.exports = function(entries, bundle) {
  var browserify = require('browserify');
  var watchify = require('watchify');
  var fs = require('fs');

  var b = browserify({
    debug: true,
    cache: {},
    packageCache: {},
    fullPaths: true
  });

  var w = watchify(b);

  w.add(entries);

  function buildBundle() {
    console.log("Creating " + bundle);
    w.bundle().pipe(fs.createWriteStream(bundle));
  }

  w.on('update', function(ids) {
    console.log("Files changed:");
    for (var i = 0; i < ids.length; i++) console.log('  ' + ids[i]);
    buildBundle();
  });

  w.on('log', console.log);

  buildBundle();
};
