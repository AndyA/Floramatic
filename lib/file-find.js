"use strict";

module.exports = (function() {

  var Q = require('q');
  var fs = require('fs');

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
      var subs = [];
      for (var i = 0; i < files.length; i++) {
        subs.push(
        Q.nfcall(fs.stat, files[i]).then((function(file) {
          return function(st) {
            if (st.isDirectory()) {
              return find(file, like).then(function(files) {
                Array.prototype.push.apply(found, files);
              });
            }

            if (st.isFile() && like.test(file)) {
              found.push(file);
            }
          }
        })(files[i])));
      }

      return Q.all(subs).then(function() {
        return found;
      });
    });
  }

  return find;

})();
