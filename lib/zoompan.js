"use strict";

var $ = require('jquery');

function ZoomPan(img) {
  this.img = img;
  this.iw = img.width;
  this.ih = img.height;
  this.setScale(1);
  this.setOffset(0, 0);
}

$.extend(ZoomPan.prototype, {

  setupContext: function(ctx) {
    ctx.scale(this.scale, this.scale);
    ctx.translate(this.ox - this.iw / 2, this.oy - this.ih / 2);
  },

  draw: function(ctx) {
    ctx.save();
    this.setupContext(ctx);
    ctx.drawImage(this.img, 0, 0);
    ctx.restore();
  },

  setOffset: function(x, y) {
    this.ox = x;
    this.oy = y;
    return this;
  },

  getState: function() {
    return {
      x: this.ox,
      y: this.oy,
      scale: this.scale
    };
  },

  setScale: function(s) {
    this.scale = s;
  },

  getScale: function() {
    return this.scale;
  }

});

module.exports = ZoomPan;
