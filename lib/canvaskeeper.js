"use strict";

function CanvasKeeper() {
  this.cache = {};
  this.base = 1.4;
  this.log_b = Math.log(this.base);
}

CanvasKeeper.MIN_SIZE = 64;

CanvasKeeper.prototype = {
  seriesSnap: function(x) {
    var snapped = Math.floor(
      Math.pow(this.base, Math.floor(Math.log(x) / this.log_b) + 1)
    );
    return Math.max(snapped, CanvasKeeper.MIN_SIZE);
  },

  hashSlot: function(w, h) {
    var key = w + ":" + h;
    if (!this.cache.hasOwnProperty(key)) this.cache[key] = [];
    return this.cache[key];
  },

  releaseCanvas: function(cvs) {
    this.hashSlot(cvs.width, cvs.height).push(cvs);
  },

  makeCanvas: function(w, h) {
    if (global.document) {
      var canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      return canvas;
    }

    var hide_from_browserify = require;
    return new (hide_from_browserify("canvas"))(w, h);
  },

  getCanvas: function(w, h) {
    var sw = this.seriesSnap(w);
    var sh = this.seriesSnap(h);

    var slot = this.hashSlot(sw, sh);
    if (slot.length) {
      var cvs = slot.pop();
      var ctx = cvs.getContext("2d");
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      return cvs;
    }

    return this.makeCanvas(sw, sh);
  }
};

module.exports = CanvasKeeper;
