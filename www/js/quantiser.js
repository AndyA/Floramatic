"use strict";

function Quantiser(opts) {
  this.options = $.extend({},
  {
    quant_angle: Math.PI / 12,
    quant_distance: 16
  },
  opts);
}

$.extend(Quantiser.prototype, {
  quantiseAngle: function(a) {
    var qa = this.options.quant_angle;
    return qa * Math.round(MathX.fmodp(a, Math.PI * 2) / qa);
  },

  quantiseWorldDistance: function(d, scale) {
    var l2s = Math.round(Math.log(scale) / Math.log(2));
    var qd = this.options.quant_distance / Math.pow(2, l2s);
    return qd * Math.round(d / qd);
  },

  quantiseScaledDistance: function(d, scale) {
    return scale * this.quantiseWorldDistance(d / scale, scale);
  },

  quantiseDistance: function(d) {
    return this.quantiseWorldDistance(d, 1);
  },
});
