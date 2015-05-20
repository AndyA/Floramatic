function Spinner(elt) {
  this.elt = elt;
  this.colours = ['rgb(255, 96, 96)', 'rgb(192, 96, 255)', 'rgb(96, 96, 255)', 'rgb(96, 255, 96)', 'white'];
  this.rot_angle = 0;
  this.throb_angle = 0;
  this.throb = {
    min: 10,
    max: 30
  };
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
    var sz = Math.min(cvs.width, cvs.height) / 2 - this.throb.max - 2;

    ctx.save();
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    ctx.translate(cvs.width / 2, cvs.height / 2);
    ctx.lineWidth = 6;
    ctx.globalAlpha = this.opacity;

    var corners = this.getCorners(sz);
    var cr = Math.sin(this.throb_angle) * (this.throb.max - this.throb.min) / 2 + (this.throb.min + this.throb.max) / 2;

    for (var pass = 0; pass < 2; pass++) {
      var prev_dot = corners[corners.length - 1];
      var a = this.rot_angle;

      for (var i = 0; i < corners.length; i++) {
        var dot = corners[i];

        var dx = Math.sin(a + Math.PI / 6) * cr;
        var dy = Math.cos(a + Math.PI / 6) * cr;

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
          this.drawCircle(ctx, dot.x, dot.y, cr);
          break;
        }

        prev_dot = dot;
        a += Math.PI * 2 / 3;
      }
    }

    ctx.restore();
  },

  next: function() {
    this.draw();
    this.rot_angle -= 0.05;
    this.throb_angle += 0.2;
  },

  start: function() {
    if (!this.running++) {
      $(this.elt).show();
      var self = this;
      var tick = function() {
        self.next();
        if (self.running || self.opacity > 0) {
          if (self.running) {
            if (self.opacity < 1) self.opacity = Math.min(self.opacity + 0.05, 1);
          }
          else {
            if (self.opacity > 0) self.opacity = Math.max(self.opacity - 0.1, -0.5);
          }
          setTimeout(tick, 20);
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
