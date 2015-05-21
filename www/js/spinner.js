function Spinner(elt) {
  this.elt = elt;

  this.config = {
    throb_min: 15,
    throb_max: 30,
    throb_step: 0.2,
    rot_step: -0.05,
    in_rate: 0.05,
    out_rate: 0.1,
    tick_time: 20
  };

  this.colours = ['rgb(255, 96, 96)', 'rgb(192, 96, 255)', 'rgb(96, 96, 255)', 'rgb(96, 255, 96)', 'white'];
  this.rot_angle = 0;
  this.throb_angle = 0;
  this.running = 0;
  this.opacity = -0.5;
}

$.extend(Spinner.prototype, {

  getCorners: function(radius) {
    var corners = [];
    var a = this.rot_angle;
    for (var i = 0; i < 3; i++) {
      corners.push({
        x: Math.sin(a) * radius,
        y: Math.cos(a) * radius
      });
      a += Math.PI * 2 / 3;
    }
    return corners;
  },

  drawCircle: function(ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.stroke();
  },

  draw: function() {
    if (this.opacity < 0) return;
    var cvs = $(this.elt).find('canvas')[0];
    var ctx = cvs.getContext('2d');
    var sz = Math.min(cvs.width, cvs.height) / 2 - this.config.throb_max - 2;

    ctx.save();
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    ctx.translate(cvs.width / 2, cvs.height / 2);
    ctx.lineWidth = 6;
    ctx.globalAlpha = this.opacity;

    var throb_scale = (this.config.throb_max - this.config.throb_min) / 2;
    var throb_origin = (this.config.throb_max + this.config.throb_min) / 2;

    var dots = this.getCorners(sz);

    for (var pass = 0; pass < 2; pass++) {
      var prev_dot, prev_throb;;

      var ra = this.rot_angle;
      var ta = this.throb_angle;

      for (var i = 0; i < dots.length + 1; i++) {
        var ii = i % dots.length;

        var dot = dots[ii];

        var dx = Math.sin(ra + Math.PI / 6);
        var dy = Math.cos(ra + Math.PI / 6);

        var throb = Math.sin(ta) * throb_scale + throb_origin;;

        if (i) {
          switch (pass) {
          case 0:
            ctx.beginPath();
            ctx.moveTo(prev_dot.x + dx * prev_throb, prev_dot.y + dy * prev_throb);
            ctx.lineTo(dot.x - dx * throb, dot.y - dy * throb);
            ctx.strokeStyle = this.colours[4];
            ctx.stroke();
            break;
          case 1:
            ctx.strokeStyle = this.colours[ii];
            this.drawCircle(ctx, dot.x, dot.y, throb);
            break;
          }
        }

        prev_dot = dot;
        prev_throb = throb;

        ra += Math.PI * 2 / 3;
        ta += Math.PI * 2 / 3;
      }
    }

    ctx.restore();
  },

  next: function() {
    this.draw();
    this.rot_angle = MathX.fmodp(this.rot_angle + this.config.rot_step, Math.PI * 2);
    this.throb_angle = MathX.fmodp(this.throb_angle + this.config.throb_step, Math.PI * 2);
  },

  start: function() {
    if (!this.running++) {
      $(this.elt).show();
      var self = this;
      var tick = function() {
        self.next();
        if (self.running || self.opacity > 0) {
          if (self.running) {
            if (self.opacity < 1) self.opacity = Math.min(self.opacity + self.config.in_rate, 1);
          }
          else {
            if (self.opacity > 0) self.opacity = Math.max(self.opacity - self.config.out_rate, -0.5);
          }
          setTimeout(tick, self.config.tick_time);
        }
        else {
          self.opacity = -0.5;
          $(self.elt).hide();
        }
      }
      tick();
    }
  },

  stop: function() {
    this.running--;
  },

});
