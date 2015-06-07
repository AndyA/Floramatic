module.exports = (function() {
  "use strict";

  var _ = require('underscore');

  var CanvasKeeper = require('./canvaskeeper.js');

  function ImageFilter(img) {
    this.img = img;
    this.cc = new CanvasKeeper;
    this.canvas = null;
    this.pixels = null;
    this.dirty = false; // pixels have been modified
  }

  _.extend(ImageFilter.prototype, {

    getCanvas: function() {
      if (null === this.canvas) {
        this.canvas = this.cc.makeCanvas(this.img.width, this.img.height);
        var ctx = this.canvas.getContext('2d');
        ctx.drawImage(this.img, 0, 0);
      }
      return this.canvas;
    },

    getContext: function() {
      return this.getCanvas().getContext('2d');
    },

    getPixels: function() {
      if (null === this.pixels) {
        this.pixels = this.getContext().getImageData(0, 0, this.img.width, this.img.height);
        this.dirty = false;
      }
      return this.pixels;
    },

    getOutput: function() {
      if (this.dirty) {
        this.getContext().putImageData(this.getPixels(), 0, 0);
        this.dirty = false;
      }
      return this.getCanvas();
    },

    getImage: function() {
      if (null === this.canvas) return this.img;
      return this.getOutput();
    },

    filter: function() {
      var args = _.toArray(arguments);
      var func = args.shift();
      args.unshift(this.getPixels());
      func.apply(this, args);
      this.dirty = true;
      return this;
    },

    // Some simple potted filters
    invert: function() {
      this.filter(function(pix) {
        var d = pix.data;
        for (var i = 0; i < d.length; i += 4) {
          d[i] = 255 - d[i];
          d[i + 1] = 255 - d[i + 1];
          d[i + 2] = 255 - d[i + 2];
        }
      });
    },

  });

  return ImageFilter;

})();
