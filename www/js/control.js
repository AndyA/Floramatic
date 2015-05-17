function Control(opts) {
  this.hs = 10; // handle size
  this.setOrigin(0.5, 0.5);
}

$.extend(Control.prototype, {

  setOrigin: function(xfrac, yfrac) {
    this.origin_x = xfrac;
    this.origin_y = yfrac;
  },

  controlCircle: function(ctx, x, y) {
    ctx.beginPath();
    ctx.moveTo(x + this.hs, y);
    ctx.arc(x, y, this.hs, 0, 2 * Math.PI);
    ctx.stroke();
  },

  inControlCircle: function(cx, cy, x, y) {
    var dx = x - cx;
    var dy = y - cy;
    return dx * dx + dy * dy <= this.hs * this.hs;
  },

});

function Controls(canvas) {
  this.canvas = canvas;
  this.controls = [];
  this.dragging = null;
}

// TODO control set, handle drawing, hit test - etc.
$.extend(Controls.prototype, {

  add: function(control) {
    this.controls.push(control);
  },

  draw: function(ctx) {
    ctx.save();
    for (var i = 0; i < this.controls.length; i++) {
      var ctl = this.controls[i];

      ctx.save();
      ctx.translate(this.canvas.width * ctl.origin_x, this.canvas.height * ctl.origin_y);
      ctl.draw(ctx);
      ctx.restore();
    }
    ctx.restore();
  },

  endDrag: function() {
    this.dragging = null;
  },

  tmpDraggingControlOffset: function(x, y) {
    if (!this.dragging) return null;
    return {
      x: x - this.canvas.width * this.dragging.origin_x,
      y: y - this.canvas.height * this.dragging.origin_y
    };
  },

  decodeClick: function(x, y) {

    for (var i = 0; i < this.controls.length; i++) {
      var ctl = this.controls[i];
      var cx = x - this.canvas.width * ctl.origin_x;
      var cy = y - this.canvas.height * ctl.origin_y;
      var hit = ctl.decodeClick(cx, cy);
      if (hit) {
        this.dragging = ctl;
        return hit;
      }
    }

    return null;
  }

});
