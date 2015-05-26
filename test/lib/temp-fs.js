"use strict";

module.exports = (function() {

  var Q = require('q');
  var tmp = require('tmp');
  var fs = require('fs');
  var path = require('path');
  var _ = require('underscore');

  tmp.setGracefulCleanup();

  function makeTree(root, tree) {
    var work = [];
    _.each(tree, function(obj, name) {
      var pn = path.join(root, name);
      if (_.isObject(obj)) {
        work.push(Q.nfcall(fs.mkdir, pn).then(function() {
          return makeTree(pn, obj);
        }));
      } else if (_.isString(obj)) {
        var ws = fs.createWriteStream(pn);
        ws.on('open', function(fd) {
          work.push(Q.ninvoke(ws, 'end', obj));
        });
      } else {
        throw new Error("Must be an object or a string");
      }
    });

    return Q.all(work).thenResolve(root);
  }

  return function(tree) {
    return Q.nfcall(tmp.dir, {
      unsafeCleanup: true
    }).spread(function(path) {
      return makeTree(path, tree);
    });
  }

})();
