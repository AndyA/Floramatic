"use strict";

module.exports = (function() {

  var Promise = require('bluebird');
  var fs = Promise.promisifyAll(require('fs'));
  var path = require('path');
  var _ = require('underscore');

  function readDir(dir) {
    return fs.readdirAsync(dir).
    then(function(files) {
      return files.map(function(name) {
        return path.join(dir, name);
      });
    });
  }

  function find(dir, like) {
    return readDir(dir).then(function(files) {
      var found = [];
      var subs = files.map(function(file) {
        return fs.statAsync(file).then(function(st) {
          if (like(file, st)) found.push(file);

          if (st.isDirectory()) {
            return find(file, like).then(function(files) {
              Array.prototype.push.apply(found, files);
            });
          }
        });
      });

      return Promise.all(subs).then(function() {
        return found
      });
    });
  }

  function quotemeta(str) {
    return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  }

  function wildcard(str) {
    var pat = str.split(/([*?])/).map(function(p) {
      switch (p) {
      case '*':
        return '[^\/\\]*';
      case '?':
        return '[^\/\\]';
      default:
        return quotemeta(p);
      }
    }).join('');

    return new RegExp('(?:^|\\|\/)' + pat + '$');
  }

  function predicate(like) {
    if (_.isNull(like) || _.isUndefined(like)) return function(file, stat) {
      return stat.isFile();
    }

    if (_.isFunction(like)) return like;

    if (_.isRegExp(like)) return function(file, stat) {
      return stat.isFile() && like.test(file);
    };

    if (_.isString(like)) return predicate(wildcard(like));

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

  return function(dir, like) {
    return find(dir, predicate(like));
  }

})();
