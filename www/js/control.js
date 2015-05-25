"use strict";

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

function Controls(canvas, opts) {
  this.canvas = canvas;
  this.options = $.extend({},
  {
    own_handlers: true
  },
  opts);
  if (!this.options.quantiser) this.options.quantiser = new Quantiser();
  this.flags = {};
  this.ordered = null;
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

    var ctls = this.getOrdered();

    for (var i = ctls.length; 0 < i--;) {
      var ctl = ctls[i];

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

  getOrdered: function() {
    if (!this.ordered) {
      var m = this.controls.map(function(el, i) {
        return {
          idx: i,
          zidx: el.getZIndex(),
          elt: el
        };
      });
      m.sort(function(a, b) {
        return a.zidx - b.zidx || a.idx - b.idx;
      });
      this.ordered = m.map(function(el) {
        return el.elt;
      });
    }
    return this.ordered;
  },

  add: function(control) {
    this.controls.push(control);
    this.ordered = null;
    control.setControls(this);
  },

  draw: function(ctx) {
    ctx.save();
    var ctls = this.getOrdered();
    for (var i = 0; i < ctls.length; i++) {
      var ctl = ctls[i];

      ctx.save();
      ctx.translate(this.canvas.width * ctl.origin_x + ctl.x, this.canvas.height * ctl.origin_y + ctl.y);
      ctl.draw(ctx);
      ctx.restore();
    }
    ctx.restore();
  }

});
