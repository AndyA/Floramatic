"use strict";

function Control() {
  this.metrics = {
    handle_size: 15,
    line_width: 4.5
  };
  this.setOrigin(0.5, 0.5);
  this.controls = null;
}

$.extend(Control.prototype, {

  setControls: function(controls) {
    this.controls = controls;
  },

  mouseDown: function(x, y) {},
  mouseMove: function(x, y, data) {},
  dropped: function(data) {},

  dragThis: function(x, y, data) {
    this.controls.startDrag(this, x, y, data);
  },

  setOrigin: function(xfrac, yfrac) {
    this.origin_x = xfrac;
    this.origin_y = yfrac;
  },

  setPosition: function(x, y) {
    this.x = x;
    this.y = y;
  },

  controlCircle: function(ctx, x, y) {
    ctx.beginPath();
    ctx.moveTo(x + this.metrics.handle_size, y);
    ctx.arc(x, y, this.metrics.handle_size, 0, 2 * Math.PI);
    ctx.stroke();
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
  },

  getQuantiser: function() {
    return this.controls.options.quantiser;
  }

});

function Controls(canvas, opts) {
  this.canvas = canvas;
  this.options = $.extend({},
  {
    own_handlers: true
  },
  opts);
  if (!this.options.quantiser) this.options.quantiser = new Quantiser();
  this.flags = {};
  this.init();
}

$.extend(Controls.prototype, {

  setFlag: function(names, state) {
    if (! (names instanceof Array)) return this.setFlag(names.split(/\s+/), state);
    for (var i = 0; i < names.length; i++) this.flags[names[i]] = state;
  },

  testFlag: function(names) {
    if (! (names instanceof Array)) return this.testFlag(names.split(/\s+/));
    for (var i = 0; i < names.length; i++) if (!this.flags[names[i]]) return false;
    return true;
  },

  stopDrag: function() {
    if (this.drag_ctx) {
      this.drag_ctx.ctl.dropped(this.drag_ctx.data);
      this.drag_ctx = null;
      $(this.canvas).off('mousemove.canvascontrols');
      $('body').off('mouseup.canvascontrols');
    }
  },

  startDrag: function(ctl, x, y, data) {
    this.stopDrag();
    this.drag_ctx = {
      ctl: ctl,
      x: x,
      y: y,
      data: data
    };
  },

  lock: function() {
    this.locked++;
  },

  unlock: function() {
    if (--this.locked == 0 && this.redraw_pending) {
      $(this.canvas).trigger('redraw');
      this.redraw_pending = 0;
    }
  },

  redraw: function() {
    this.lock();
    this.redraw_pending++;
    this.unlock();
  },

  mouseDown: function(e) {
    this.stopDrag();

    var x = e.pageX - $(e.target).offset().left;
    var y = e.pageY - $(e.target).offset().top;

    for (var i = 0; i < this.controls.length; i++) {
      var ctl = this.controls[i];

      var cx = x - (this.canvas.width * ctl.origin_x + ctl.x);
      var cy = y - (this.canvas.height * ctl.origin_y + ctl.y);

      ctl.mouseDown(cx, cy);

      if (this.drag_ctx) {
        var ctx = this.drag_ctx;
        ctx.dx = ctx.x - cx;
        ctx.dy = ctx.y - cy;
        var self = this;

        $(this.canvas).on('mousemove.canvascontrols', function(e) {
          var x = e.pageX - $(e.target).offset().left;
          var y = e.pageY - $(e.target).offset().top;

          var cx = x - (self.canvas.width * ctx.ctl.origin_x + ctx.ctl.x) + ctx.dx;
          var cy = y - (self.canvas.height * ctx.ctl.origin_y + ctx.ctl.y) + ctx.dy;

          ctx.ctl.mouseMove(cx, cy, ctx.data);
          self.redraw();
        });

        $('body').on('mouseup.canvascontrols', function(e) {
          self.stopDrag();
        });

        return true;
      }
    }
    return false;
  },

  init: function() {
    this.controls = [];
    this.drag_ctx = null;
    this.locked = 0;
    this.redraw_pending = 0;

    if (this.options.own_handlers) {
      var self = this;
      $(this.canvas).on('mousedown.canvascontrols', function(e) {
        if (e.which == 1 && self.mouseDown(e)) e.stopImmediatePropagation();
      });
    }
  },

  destroy: function() {
    $(this.canvas).off('.canvascontrols');
  },

  trigger: function(ev, ui) {
    $(this.canvas).trigger(ev, ui);
  },

  add: function(control) {
    this.controls.push(control);
    control.setControls(this);
  },

  draw: function(ctx) {
    ctx.save();
    for (var i = 0; i < this.controls.length; i++) {
      var ctl = this.controls[i];

      ctx.save();
      ctx.translate(this.canvas.width * ctl.origin_x + ctl.x, this.canvas.height * ctl.origin_y + ctl.y);
      ctl.draw(ctx);
      ctx.restore();
    }
    ctx.restore();
  }

});
