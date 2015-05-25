"use strict";

var $ = require('./jquery-2.1.4.min.js');

function Affine(a, b, c, d, e, f) {
  this.a = a;
  this.b = b;
  this.c = c;
  this.d = d;
  this.e = e;
  this.f = f;
}

$.extend(Affine, {
  newRotate: function(a) {
    var s = Math.sin(a);
    var c = Math.cos(a);
    return new Affine(c, s, -s, c, 0, 0);
  },

  newTranslate: function(dx, dy) {
    return new Affine(1, 0, 0, 1, dx, dy);
  },

  newScale: function(sx, sy) {
    return new Affine(sx, 0, 0, sy, 0, 0);
  }
});

$.extend(Affine.prototype, {
  transform: function(pt) {
    return {
      x: pt.x * this.a + pt.y * this.b + this.e,
      y: pt.x * this.c + py.y * this.d + this.f
    };
  },

  clone: function() {
    return new Affine(this.a, this.b, this.c, this.d, this.e, this.f);
  },

  multiply: function(other) {
    var a = this.a * other.a + this.b * other.c;
    var b = this.a * other.b + this.b * other.d;
    var c = this.c * other.a + this.d * other.c;
    var d = this.c * other.b + this.d * other.d;
    var e = this.e * other.a + this.f * other.c + other.e;
    var f = this.e * other.b + this.f * other.d + other.f;
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
  },

  rotate: function(a) {
    this.multiply(Affine.newRotate(a));
  },

  translate: function(dx, dy) {
    this.multiply(Affine.newTranslate(dx, dy));
  },

  scale: function(sx, sy) {
    this.multiply(Affine.newScale(sx, sy));
  }
});

module.exports = Affine;
