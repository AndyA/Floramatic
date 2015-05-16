function Triangle(x, y, r, a) {
  this.setCentre(x, y);
  this.setRadius(r);
  this.setAngle(a);
  this.hs = 10; // handle size
  this.colours = ['rgb(255, 128, 128)', 'rgb(128, 255, 128)', 'rgb(128, 128, 255)', 'white'];
}

$.extend(Triangle.prototype, {

  setCentre: function(x, y) {
    this.x = x;
    this.y = y;
  },

  setRadius: function(r) {
    this.r = r;
  },

  setAngle: function(a) {
    this.a = a;
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

  controlCircle: function(ctx, x, y) {
    ctx.beginPath();
    ctx.moveTo(x + this.hs, y);
    ctx.arc(x, y, this.hs, 0, 2 * Math.PI);
    ctx.stroke();
  },

  // Draw the controller triangle
  drawController: function(ctx) {
    ctx.save();
    ctx.lineWidth = 3;

    var corners = this.getCorners();

    ctx.strokeStyle = this.colours[3];
    this.controlCircle(ctx, this.x, this.y);

    for (var pass = 0; pass < 2; pass++) {
      var prev_dot = corners[corners.length - 1];
      var a = this.a;
      for (var i = 0; i < corners.length; i++) {
        var dot = corners[i];

        var dx = Math.sin(a + Math.PI / 6) * this.hs
        var dy = Math.cos(a + Math.PI / 6) * this.hs;

        switch (pass) {
        case 0:
          ctx.beginPath();
          ctx.moveTo(prev_dot.x + dx, prev_dot.y + dy);
          ctx.lineTo(dot.x - dx, dot.y - dy);
          ctx.strokeStyle = this.colours[3];
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

  inControlCircle: function(cx, cy, x, y) {
    var dx = x - cx;
    var dy = y - cy;
    return dx * dx + dy * dy <= this.hs * this.hs;
  },

  decodeClick: function(x, y) {
    if (this.inControlCircle(this.x, this.y, x, y)) return {
      dx: x - this.x,
      dy: y - this.y,
      pt: 4
    };

    var corners = this.getCorners();
    for (var i = 0; i < corners.length; i++) {
      var dot = corners[i];
      if (this.inControlCircle(dot.x, dot.y, x, y)) return {
        dx: x - dot.x,
        dy: y - dot.y,
        pt: i
      };
    }

    return null;
  },

  path: function(ctx) {
    var corners = this.getCorners();
    for (var i = 0; i < corners.length; i++) {
      var dot = corners[i];
      if (i == 0) ctx.moveTo(dot.x, dot.y);
      else ctx.lineTo(dot.x, dot.y);
    }
  },

  fill: function(ctx) {
    ctx.beginPath();
    this.path(ctx);
    ctx.fill();
  },

  makeCanvas: function(w, h) {
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return canvas
  },

  drawOrigin: function(ctx, style) {
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = style;
    ctx.beginPath();

    var r = 10;
    while (r < 500) {
      ctx.moveTo(r, 0);
      ctx.arc(0, 0, r, 0, 2 * Math.PI);
      r *= 1.1;
    }

    ctx.stroke();
    ctx.restore();
  },

  sample: function(img, zoom) {
    var cx = Math.cos(Math.PI / 6) * this.r;
    var cy = Math.sin(Math.PI / 6) * this.r;

    var w = Math.round(cx * 2);
    var h = Math.round(cy + this.r);

    var cvs = this.makeCanvas(w, h);
    var ctx = cvs.getContext('2d');

    ctx.save();

    var ccx = zoom.cw / 2;
    var ccy = zoom.ch / 2;

    ctx.translate(ccx, ccy);
    ctx.scale(zoom.scale, zoom.scale);
    ctx.translate((cx - ccx) / zoom.scale, (cy - ccy) / zoom.scale);
    ctx.rotate(this.a);
    ctx.translate((zoom.ox - zoom.iw / 2) + (ccx - this.x) / zoom.scale, (zoom.oy - zoom.ih / 2) + (ccy - this.y) / zoom.scale);

    ctx.drawImage(img, 0, 0);

    ctx.restore();

    // Mask with our triangle
    ctx.save();

    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo((w - 1) / 2, h - 1);
    ctx.lineTo(w - 1, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    return {
      image: cvs,
      cx: cx,
      cy: cy
    };
  }

});
