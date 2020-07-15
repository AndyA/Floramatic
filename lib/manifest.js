"use strict";

module.exports = (function() {
  var findFiles = require("../lib/file-find.js");
  var manifest = {};

  return function(root, like, prefix) {
    if (arguments.length < 3) prefix = "";
    var like_key = like.toString();
    if (!manifest.hasOwnProperty(root)) manifest[root] = {};
    if (!manifest[root].hasOwnProperty(prefix)) manifest[root][prefix] = {};
    var slot = manifest[root][prefix];
    if (!slot.hasOwnProperty(like_key)) {
      slot[like_key] = findFiles(root, like).then(function(files) {
        var mani = {};
        for (var i = 0; i < files.length; i++) {
          var id = "id" + i;
          mani[id] = prefix + files[i].substr(root.length);
        }
        return mani;
      });
    }

    return slot[like_key];
  };
})();
