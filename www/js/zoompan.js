"use strict";

function ZoomPan(cw, ch, iw, ih) {
  this.setCanvasSize(cw, ch);
  this.setImageSize(iw, ih);
  this.setScale(1);
  this.setOffset(0, 0);
}

$.extend(ZoomPan.prototype, {

  setupContext: function(ctx) {
    var ccx = this.cw / 2;
    var ccy = this.ch / 2;
    ctx.translate(ccx, ccy);
    ctx.scale(this.scale, this.scale);
    ctx.translate(this.ox - this.iw / 2, this.oy - this.ih / 2);
  },

  _sizeUpdated: function() {
    this.setOffset(this.ox, this.oy);
  },

  setCanvasSize: function(w, h) {
    this.cw = w;
    this.ch = h;
    this._sizeUpdated();
  },

  setImageSize: function(w, h) {
    this.iw = w;
    this.ih = h;
    this._sizeUpdated();
  },

  getScaledSize: function() {
    return {
      w: this.iw * this.scale,
      h: this.ih * this.scale
    };
  },

  setOffset: function(x, y) {
    var xr = this.iw / 2;
    var yr = this.ih / 2;

    this.ox = Math.max(-xr, Math.min(x, xr));
    this.oy = Math.max(-yr, Math.min(y, yr));
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
