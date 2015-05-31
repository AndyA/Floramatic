"use strict";

var $ = require('jquery');

function ZoomPan(img) {
  this.img = img;
  this.setScale(1);
  this.setOffset(0, 0);
}

$.extend(ZoomPan.prototype, {

  draw: function(ctx) {
    ctx.save();
    ctx.scale(this.scale, this.scale);
    ctx.translate(this.ox - this.img.width / 2, this.oy - this.img.height / 2);
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
