"use strict";

function ZoomPan(img) {
  this.img = img;
  this.setScale(1);
  this.setOffset(0, 0);
}

ZoomPan.prototype = {

  draw: function(ctx) {
    ctx.save();
    ctx.scale(this.scale, this.scale);
    ctx.translate(this.x - this.img.width / 2, this.y - this.img.height / 2);
    ctx.drawImage(this.img, 0, 0);
    ctx.restore();
  },

  setOffset: function(x, y) {
    this.x = x;
    this.y = y;
    return this;
  },

  getState: function() {
    return {
      x: this.x,
      y: this.y,
      scale: this.scale
    };
  },

  setScale: function(s) {
    this.scale = s;
  },

  getScale: function() {
    return this.scale;
  }

};

module.exports = ZoomPan;
