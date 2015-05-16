function Triangle(x, y, r, a) {
  this.setCentre(x, y);
  this.setRadius(r);
  this.setAngle(a);
  this.hs = 10; // handle size
  this.colours = ['rgb(255, 128, 128)', 'rgb(128, 255, 128)', 'rgb(128, 128, 255)', 'white'];
  this.canvas_keeper = new CanvasKeeper();
}

$.extend(Triangle.prototype, {

  setCentre: function(x, y) {
    //    console.log('setCentre(' + x + ', ' + y + ')');
    this.x = x;
    this.y = y;
  },

  setRadius: function(r) {
    //    console.log('setRadius(' + r + ')');
    this.r = r;
  },

  setAngle: function(a) {
    //    console.log('setAngle(' + a + ')');
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

  cuttingForRadius: function(r) {
    var tx = Math.cos(Math.PI / 6) * r;
    var ty = Math.sin(Math.PI / 6) * r;

    return {
      image: this.canvas_keeper.getCanvas(Math.floor(tx * 2 + 2), Math.floor(ty + r + 2)),
      tri_x: tx,
      tri_y: ty,
      centre_x: tx + 1,
      centre_y: ty + 1,
      r: r
    }
  },

  sample: function(img, zoom) {

    var cut = this.cuttingForRadius(this.r);
    var ctx = cut.image.getContext('2d');

    ctx.save();

    var ccx = zoom.cw / 2;
    var ccy = zoom.ch / 2;

    ctx.translate(ccx, ccy);
    ctx.scale(zoom.scale, zoom.scale);
    ctx.translate((cut.centre_x - ccx) / zoom.scale, (cut.centre_y - ccy) / zoom.scale);
    ctx.rotate(this.a);
    ctx.translate((zoom.ox - zoom.iw / 2) + (ccx - this.x) / zoom.scale, (zoom.oy - zoom.ih / 2) + (ccy - this.y) / zoom.scale);

    ctx.drawImage(img, 0, 0);

    ctx.restore();

    // Mask with our triangle
    ctx.save();

    var grow = 1.5;
    var gr = this.r + grow;

    var tx = cut.tri_x / this.r * gr;
    var ty = cut.tri_y / this.r * gr;

    ctx.globalCompositeOperation = 'destination-in';
    ctx.translate(cut.centre_x, cut.centre_y);
    ctx.beginPath();
    ctx.moveTo(0, gr);
    ctx.lineTo(tx, -ty);
    ctx.lineTo(-tx, -ty);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    return cut;
  },

  releaseCutting: function(cut) {
    this.canvas_keeper.releaseCanvas(cut.image);
  },

  expand: function(cut) {
    var ncut = this.cuttingForRadius(cut.r * 2);
    var ctx = ncut.image.getContext('2d');
    ctx.save();

    ctx.translate(ncut.centre_x, ncut.centre_y);
    ctx.rotate(Math.PI);
    ctx.drawImage(cut.image, -cut.centre_x, -cut.centre_y);

    for (var i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate(Math.PI * i * 2 / 3);
      ctx.translate(0, -cut.tri_y);
      ctx.scale(1, -1);
      ctx.translate(0, cut.tri_y);
      ctx.rotate(-Math.PI * i * 2 / 3);
      ctx.drawImage(cut.image, -cut.centre_x, -cut.centre_y);
      ctx.restore();
    }

    ctx.restore();

    // Assume we're done with the context in cut
    this.releaseCutting(cut);

    return ncut;
  }

});
