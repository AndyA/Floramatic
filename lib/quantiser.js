"use strict";

var $ = require('jquery');

var MathX = require('./mathx.js');

function Quantiser(opts) {
  this.options = $.extend({},
  {
    angle: Math.PI / 12,
    distance: 16,
    scale: 1
  },
  opts);
}

$.extend(Quantiser.prototype, {
  setScale: function(s) {
    this.options.scale = s
  },

  quantiseAngle: function(a) {
    var qa = this.options.angle;
    return qa * Math.round(MathX.fmodp(a, Math.PI * 2) / qa);
  },

  quantiseWorldDistance: function(d) {
    var l2s = Math.round(Math.log(this.options.scale) / Math.log(2));
    var qd = this.options.distance / Math.pow(2, l2s);
    return qd * Math.round(d / qd);
  },

  quantiseScaledDistance: function(d) {
    var sc = this.options.scale;
    return sc * this.quantiseWorldDistance(d / sc, sc);
  },

  quantiseDistance: function(d) {
    return this.quantiseWorldDistance(d, 1);
  },
});

module.exports = Quantiser;
