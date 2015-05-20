function Control(opts) {
  this.hs = 10; // handle size
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
    ctx.moveTo(x + this.hs, y);
    ctx.arc(x, y, this.hs, 0, 2 * Math.PI);
    ctx.stroke();
  },

  inControlCircle: function(cx, cy, x, y) {
    var dx = x - cx;
    var dy = y - cy;
    return dx * dx + dy * dy <= this.hs * this.hs;
  },

  trigger: function() {
    var args = Array.prototype.slice.apply(arguments);
    this.controls.trigger.apply(this.controls, args);
  },

});

function Controls(canvas) {
  this.canvas = canvas;
  this.init();
}

// TODO control set, handle drawing, hit test - etc.
$.extend(Controls.prototype, {

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

  crossHair: function(x, y, style) {
    var ctx = this.canvas.getContext('2d');
    ctx.save();
    ctx.strokeStyle = style;
    ctx.lineWidth = 4;
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(0, 30);
    ctx.moveTo(-30, 0);
    ctx.lineTo(30, 0);
    ctx.stroke();
    ctx.restore();
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

  init: function() {
    this.controls = [];
    this.drag_ctx = null;
    this.locked = 0;
    this.redraw_pending = 0;

    var self = this;

    $(this.canvas).on('mousedown.canvascontrols', function(e) {
      if (e.which != 1) return;
      self.stopDrag();

      var x = e.pageX - $(e.target).offset().left;
      var y = e.pageY - $(e.target).offset().top;

      for (var i = 0; i < self.controls.length; i++) {
        var ctl = self.controls[i];

        var cx = x - (self.canvas.width * ctl.origin_x + ctl.x);
        var cy = y - (self.canvas.height * ctl.origin_y + ctl.y);

        ctl.mouseDown(cx, cy);

        if (self.drag_ctx) {
          var ctx = self.drag_ctx;
          ctx.dx = ctx.x - cx;
          ctx.dy = ctx.y - cy;

          $(self.canvas).on('mousemove.canvascontrols', function(e) {
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

          e.stopImmediatePropagation();
          break;
        }
      }
    });
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
