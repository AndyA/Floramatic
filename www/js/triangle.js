function Triangle(x, y, r, a) {
  this.setPosition(x, y);
  this.setRadius(r);
  this.setAngle(a);
  this.colours = ['rgb(255, 96, 96)', 'rgb(192, 96, 255)', 'rgb(96, 96, 255)', 'rgb(96, 255, 96)', 'white'];
  this.canvas_keeper = new CanvasKeeper();
}

Triangle.MIN_TILE = 256;

Triangle.prototype = new Control();
$.extend(Triangle.prototype, {

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

  // Draw the controller triangle
  draw: function(ctx) {
    ctx.save();
    ctx.translate(-this.x, -this.y);
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
    if (data.pt == 4) {
      this.setPosition(this.x + x, this.y + y);
    } else {
      var dx = x;
      var dy = y;
      if (data.pt == 0 || data.pt == 1) {
        this.setRadius(Math.sqrt(dx * dx + dy * dy));
      }
      if (data.pt == 1 || data.pt == 2) {
        this.setAngle(Math.PI / 2 - Math.PI * 2 * data.pt / 3 - Math.atan2(dy, dx));
      }
    }
  },

  cuttingForRect: function(w, h) {
    return {
      image: this.canvas_keeper.getCanvas(Math.floor(w + 2), Math.floor(h + 2)),
      width: w,
      height: h,
      centre_x: w / 2,
      centre_y: h / 2,
      kind: 'rect'
    }
  },

  cuttingForRadius: function(r) {
    var tx = Math.cos(Math.PI / 6) * r;
    var ty = Math.sin(Math.PI / 6) * r;

    var cut = this.cuttingForRect(Math.floor(tx * 2 + 2), Math.floor(ty + r + 2));

    cut.tri_x = tx;
    cut.tri_y = ty;
    cut.centre_x = tx + 1;
    cut.centre_y = ty + 1;
    cut.r = r;
    cut.kind = 'triangle';

    return cut;
  },

  releaseCutting: function(cut) {
    this.canvas_keeper.releaseCanvas(cut.image);
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
    ctx.translate((zoom.ox - zoom.iw / 2) - this.x / zoom.scale, (zoom.oy - zoom.ih / 2) - this.y / zoom.scale);

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
    ctx.strokeStyle = 'black';

    if (0) {
      ctx.lineWidth = 4;
      ctx.globalCompositeOperation = 'source-over';
      ctx.stroke();
    }

    ctx.restore();

    return cut;
  },

  makeRect: function(cut) {
    if (cut.kind == 'rect') return cut;

    var cx = Math.cos(Math.PI / 6) * cut.r;
    var cy = Math.sin(Math.PI / 6) * cut.r;

    var tw = cx * 2;
    var th = cy + cut.r;

    var ncut = this.cuttingForRect(tw * 3, th * 2);
    var ctx = ncut.image.getContext('2d');
    ctx.save();

    ctx.translate(cut.centre_x - cx, cut.centre_y);

    for (var i = 0; i < 2; i++) {
      ctx.save();
      ctx.drawImage(cut.image, -cut.centre_x, -cut.centre_y);
      for (var j = 0; j < 2; j++) {
        ctx.rotate(Math.PI * 2 / 3);
        ctx.translate(0, -cut.tri_y);
        ctx.scale(1, -1);
        ctx.translate(0, cut.tri_y);
        ctx.rotate(-Math.PI * 2 / 3);
        ctx.drawImage(cut.image, -cut.centre_x, -cut.centre_y);

        ctx.translate(0, -cut.tri_y);
        ctx.scale(1, -1);
        ctx.translate(0, cut.tri_y);
        ctx.drawImage(cut.image, -cut.centre_x, -cut.centre_y);

        ctx.rotate(-Math.PI * 2 / 3);
        ctx.translate(0, -cut.tri_y);
        ctx.scale(1, -1);
        ctx.translate(0, cut.tri_y);
        ctx.rotate(Math.PI * 2 / 3);
        ctx.drawImage(cut.image, -cut.centre_x, -cut.centre_y);
      }
      ctx.restore();
      ctx.translate(0, cut.r);
      ctx.scale(1, -1);
      ctx.translate(0, -cut.r);
    }

    ctx.restore();
    this.releaseCutting(cut);

    return ncut;
  },

  rawTile: function(cut, ctx, w, h, xo, yo) {
    var tw = Math.floor((w - xo + 2 * cut.width) / cut.width);
    var th = Math.floor((h - yo + 2 * cut.height) / cut.height);

    ctx.save();

    ctx.translate(xo - cut.width, yo - cut.height);
    for (y = 0; y < th; y++) {
      for (x = 0; x < tw; x++) {
        ctx.drawImage(cut.image, x * cut.width, y * cut.height);
      }
    }

    ctx.restore();
  },

  tile: function(cut, ctx, w, h, xo, yo) {
    cut = this.makeRect(cut);

    if ((cut.width < w && cut.width < Triangle.MIN_TILE) || (cut.height < h && cut.height < Triangle.MIN_TILE)) {
      var tw = Math.floor(Triangle.MIN_TILE / cut.width + 1) * cut.width;
      var th = Math.floor(Triangle.MIN_TILE / cut.height + 1) * cut.height;
      var ncut = this.cuttingForRect(tw, th);
      var nctx = ncut.image.getContext('2d');
      this.rawTile(cut, nctx, tw, th, 0, 0);
      this.rawTile(ncut, ctx, w, h, MathX.fmodp(xo - cut.width / 2, tw), MathX.fmodp(yo - cut.height, th));
      this.releaseCutting(ncut);
    }
    else {
      this.rawTile(cut, ctx, w, h, MathX.fmodp(xo - cut.width / 2, cut.width), MathX.fmodp(yo - cut.height, cut.height));
    }
    this.releaseCutting(cut);
  },

  makeImage: function(cut, w, h) {
    var cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    this.tile(cut, cvs.getContext('2d'), w, h, w / 2, h / 2);
    return cvs;
  }
});
