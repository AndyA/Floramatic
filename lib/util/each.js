module.exports = (function() {
  var _ = require('underscore');

  return {
    sortedKeys: function() {
      var args = _.toArray(arguments);
      if (args.length < 2 || args.length > 3) throw new Error('sortedKeys needs 2 or 3 args');
      var obj = args.shift();
      if (!_.isObject(obj)) throw new Error('sortedKeys needs an Object for first arg');
      var cb = args.pop();
      if (!_.isFunction(cb)) throw new Error('sortedKeys needs a function for its last arg');
      var keys = _.keys(obj);
      Array.prototype.sort.apply(keys, args);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        cb(obj[k], k);
      }
    }
  }

})();
