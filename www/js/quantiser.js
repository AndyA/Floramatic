function Quantiser(opts) {
  this.options = $.extend({},
  {
    quant_angle: Math.PI / 12,
    quant_radius: 1.2,
    quant_distance: 16
  },
  opts);
}

$.extend(Quantiser.prototype, {
  quantiseAngle: function(a) {
    var qa = this.options.quant_angle;
    return qa * Math.round(MathX.fmodp(a, Math.PI * 2) / qa);
  },

  quantiseRadius: function(r) {
    var qr = this.options.quant_radius;
    return Math.pow(qr, Math.round(Math.log(r) / Math.log(qr)));
  },

  quantiseDistance: function(d) {
    var qd = this.options.quant_distance;
    return qd * Math.round(d / qd);
  }
});
