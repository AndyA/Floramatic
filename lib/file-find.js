"use strict";

module.exports = (function() {

  var Q = require('q');
  var fs = require('fs');
  var _ = require('underscore');

  function readDir(path) {
    return Q.nfcall(fs.readdir, path).then(function(files) {
      return files.map(function(name) {
        return path + '/' + name
      });
    });
  }

  function find(path, like) {
    return readDir(path).then(function(files) {
      var found = [];
      var subs = files.map(function(file) {
        return Q.nfcall(fs.stat, file).then(function(st) {
          if (like(file, st)) found.push(file);

          if (st.isDirectory()) {
            return find(file, like).then(function(files) {
              Array.prototype.push.apply(found, files);
            });
          }
        });
      });

      return Q.all(subs).thenResolve(found);
    });
  }

  function predicate(like) {
    if (_.isFunction(like)) return like;

    if (_.isRegExp(like)) return function(file, stat) {
      return stat.isFile() && like.test(file);
    };

    if (_.isString(like)) return function(file, stat) {
      return stat.isFile() && file.substr(-like.length) == like;
    };

    if (_.isArray(like)) {
      var preds = like.map(predicate);
      return function(file, stat) {
        for (var p = 0; p < preds.length; p++) {
          if (!preds[p](file, stat)) return false;
        }
        return true;
      };
    }

    throw new Error("Can't make a predicate with that");
  }

  return function(path, like) {
    return find(path, predicate(like));
  }

})();
