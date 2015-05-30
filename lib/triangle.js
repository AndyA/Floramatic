"use strict";

var $ = require('jquery');

var Control = require('./control.js');
var Modifiers = require('./modifiers.js');

function Triangle(x, y, r, a) {
  this.colours = ['rgb(255, 96, 96)', 'rgb(192, 96, 255)', 'rgb(96, 96, 255)', 'rgb(96, 255, 96)', 'white'];
  this.setPosition(x, y);
  this.setRadius(r);
  this.setAngle(a);
}

Triangle.prototype = new Control();

$.extend(Triangle.prototype, {

  setRadius: function(r) {
    this.r = Math.max(r, this.metrics.handle_size / 2);
  },

  getRadius: function() {
    return this.r;
  },

  setAngle: function(a) {
    this.a = a;
  },

  getAngle: function() {
    return this.a;
  },

  getCorners: function() {
    var corners = [];
    var a = this.a;
    for (var i = 0; i < 3; i++) {
      corners.push({
        x: Math.sin(a) * this.r + this.x,
        y: Math.cos(a) * this.r + this.y
      });
      a += Math.PI * 2 / 3;
    }
    return corners;
  },

  // Draw the controller triangle
  draw: function(ctx) {
    ctx.save();
    ctx.translate(-this.x, -this.y);
    ctx.lineWidth = this.metrics.line_width;

    var corners = this.getCorners();

    ctx.strokeStyle = this.colours[3];
    this.controlCircle(ctx, this.x, this.y);

    for (var pass = 0; pass < 2; pass++) {
      var prev_dot = corners[corners.length - 1];
      var a = this.a;
      for (var i = 0; i < corners.length; i++) {
        var dot = corners[i];

        var dx = Math.sin(a + Math.PI / 6) * this.metrics.handle_size
        var dy = Math.cos(a + Math.PI / 6) * this.metrics.handle_size;

        switch (pass) {
        case 0:
          ctx.beginPath();
          ctx.moveTo(prev_dot.x + dx, prev_dot.y + dy);
          ctx.lineTo(dot.x - dx, dot.y - dy);
          ctx.strokeStyle = this.colours[4];
          ctx.stroke();
          break;
        case 1:
          ctx.strokeStyle = this.colours[i];
          this.controlCircle(ctx, dot.x, dot.y);
          break;
        }

        prev_dot = dot;
        a += Math.PI * 2 / 3;
      }
    }

    ctx.restore();
  },

  mouseDown: function(x, y) {
    if (this.inControlCircle(0, 0, x, y)) {
      this.dragThis(0, 0, {
        pt: 4
      });
      return;
    }

    var corners = this.getCorners();
    for (var i = 0; i < corners.length; i++) {
      var dot = corners[i];
      if (this.inControlCircle(dot.x - this.x, dot.y - this.y, x, y)) {
        this.dragThis(dot.x - this.x, dot.y - this.y, {
          pt: i
        });
        return;
      }
    }
  },

  mouseMove: function(x, y, data) {
    var snap = Modifiers.down('shift');
    var quantiser = this.getQuantiser();
    if (data.pt == 4) {
      var nx = this.x + x;
      var ny = this.y + y;
      if (snap) {
        nx = quantiser.quantiseScaledDistance(nx);
        ny = quantiser.quantiseScaledDistance(ny);
      }
      this.setPosition(nx, ny);
    } else {
      var dx = x;
      var dy = y;
      if (data.pt == 0 || data.pt == 1) {
        var r = Math.sqrt(dx * dx + dy * dy);
        if (snap) {
          r = quantiser.quantiseScaledDistance(r);
        }
        this.setRadius(r);
      }
      if (data.pt == 1 || data.pt == 2) {
        var a = Math.PI / 2 - Math.PI * 2 * data.pt / 3 - Math.atan2(dy, dx);
        if (snap) a = quantiser.quantiseAngle(a);
        this.setAngle(a);
      }
    }
  }
});

module.exports = Triangle;
