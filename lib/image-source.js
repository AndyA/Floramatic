module.exports = (function() {
  "use strict";

  var _ = require('underscore');
  var each = require('./util/each.js');
  var ImageFilter = require('./image-filter.js');

  var filters = {
    // Some simple potted filters
    invert: function(pix) {
      var d = pix.data;
      for (var i = 0; i < d.length; i += 4) {
        d[i] = 255 - d[i];
        d[i + 1] = 255 - d[i + 1];
        d[i + 2] = 255 - d[i + 2];
      }
    }
  };

  function filterKey(enabled) {
    var key = [];
    each.sortedKeys(enabled, function(v, k) {
      if (v) key.push(k);
    });
    if (!key.length) return null;
    return key.join('-');
  }

  function ImageSource(img) {
    this.img = img;
    this.enabled = {};
    this.cache = {};
    var self = this;
    each.sortedKeys(filters, function(v, k) {
      self.enabled[k] = false;
    });
  }

  _.extend(ImageSource.prototype, {
    setFilter: function(name, state) {
      if (!filters.hasOwnProperty(name)) throw new Error(
        'Unknown filter: ' + name);
      this.enabled[name] = state;
      return this;
    },

    getFilter: function(name) {
      if (!filters.hasOwnProperty(name)) throw new Error(
        'Unknown filter: ' + name);
      return this.enabled[name];
    },

    toggleFilter: function(name) {
      this.setFilter(name, !this.getFilter(name));
    },

    getImage: function() {
      var fk = filterKey(this.enabled);
      if (null === fk) return this.img;
      if (!this.cache.hasOwnProperty(fk)) {
        var filt = new ImageFilter(this.img);
        each.sortedKeys(this.enabled, function(v, k) {
          if (v) filt.filter(filters[k]);
        });
        this.cache[fk] = filt.getImage();
      }
      return this.cache[fk];
    }

  });

  return ImageSource;

})();
