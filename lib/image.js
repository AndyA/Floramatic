module.exports = (function() {
  "use strict";

  var _ = require('underscore');
  var ImageFilter = require('./image-filter.js');

  function Image(img) {
    this.img = img;
  }

  _.extend(Image.prototype, {

    getImage: function() {
      return this.img
    }

  });

  return Image;

})();
