"use strict";

var $ = require('./jquery-2.1.4.min.js');

function Control() {
  this.metrics = {
    handle_size: 15,
    line_width: 4.5
  };
  this.setOrigin(0.5, 0.5);
  this.setZIndex(0);
  this.controls = null;
}

$.extend(Control.prototype, {

  setControls: function(controls) {
    this.controls = controls;
    return this;
  },

  getZIndex: function() {
    return this.zindex;
  },

  setZIndex: function(zi) {
    this.zindex = zi;
    return this;
  },

  mouseDown: function(x, y) {},
  mouseMove: function(x, y, data) {},
  dropped: function(data) {},

  dragThis: function(x, y, data) {
    this.controls.startDrag(this, x, y, data);
    return this;
  },

  setOrigin: function(xfrac, yfrac) {
    this.origin_x = xfrac;
    this.origin_y = yfrac;
    return this;
  },

  setPosition: function(x, y) {
    this.x = x;
    this.y = y;
    return this;
  },

  getPosition: function() {
    return {
      x: this.x,
      y: this.y
    };
  },

  translatePosition: function(dx, dy) {
    this.x += dx;
    this.y += dy;
    return this;
  },

  controlCircle: function(ctx, x, y) {
    ctx.beginPath();
    ctx.moveTo(x + this.metrics.handle_size, y);
    ctx.arc(x, y, this.metrics.handle_size, 0, 2 * Math.PI);
    ctx.stroke();
    return this;
  },

  inControlCircle: function(cx, cy, x, y) {
    var dx = x - cx;
    var dy = y - cy;
    var hs = this.metrics.handle_size;
    if (this.controls.testFlag('fat')) hs *= 2;
    return dx * dx + dy * dy <= hs * hs;
  },

  trigger: function() {
    var args = Array.prototype.slice.apply(arguments);
    this.controls.trigger.apply(this.controls, args);
    return this;
  },

  getQuantiser: function() {
    return this.controls.options.quantiser;
  }

});

module.exports = Control;
