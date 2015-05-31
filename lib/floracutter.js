"use strict";

var MathX = require('./mathx.js');

function FloraCutter(cc) {
  this.canvas_keeper = cc || new(require('./canvaskeeper.js'));
}

FloraCutter.MIN_TILE = 256;

FloraCutter.prototype = {

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

  makeTriangle: function(tri, cb) {

    var cut = this.cuttingForRadius(tri.r);
    var ctx = cut.image.getContext('2d');

    ctx.save();

    ctx.translate(cut.centre_x, cut.centre_y);
    ctx.rotate(tri.a);
    ctx.translate(-tri.x, -tri.y);

    cb(ctx);

    ctx.restore();

    // Mask with our triangle
    ctx.save();

    var grow = 1.5;
    var gr = tri.r + grow;

    var tx = cut.tri_x / tri.r * gr;
    var ty = cut.tri_y / tri.r * gr;

    ctx.globalCompositeOperation = 'destination-in';
    ctx.translate(cut.centre_x, cut.centre_y);
    ctx.beginPath();
    ctx.moveTo(0, gr);
    ctx.lineTo(tx, -ty);
    ctx.lineTo(-tx, -ty);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'black';

    ctx.restore();

    return cut;
  },

  rawRect: function(cut, ctx) {
    ctx.save();

    ctx.translate(cut.centre_x - cut.tri_x, cut.centre_y);

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
  },

  makeRect: function(cut) {
    if (cut.kind == 'rect') return cut;

    var tw = cut.tri_x * 2;
    var th = cut.tri_y + cut.r;

    var ncut = this.cuttingForRect(tw * 3, th * 2);
    var ctx = ncut.image.getContext('2d');
    this.rawRect(cut, ctx);
    this.releaseCutting(cut);

    return ncut;
  },

  rawTile: function(cut, ctx, w, h, xo, yo) {
    if (xo == 0) xo = cut.width;
    if (yo == 0) yo = cut.height;

    var tw = Math.floor((w - xo + 2 * cut.width) / cut.width);
    var th = Math.floor((h - yo + 2 * cut.height) / cut.height);

    ctx.save();

    ctx.translate(xo - cut.width, yo - cut.height);
    for (var y = 0; y < th; y++) {
      for (var x = 0; x < tw; x++) {
        ctx.drawImage(cut.image, x * cut.width, y * cut.height);
      }
    }

    ctx.restore();
  },

  drawTile: function(ctx, x, y, w, h, tri, cb) {
    var cut = this.makeRect(this.makeTriangle(tri, cb));
    var xo = w / 2 + (arguments.length > 7 ? arguments[8] : 0);
    var yo = h / 2 + (arguments.length > 8 ? arguments[9] : 0);

    ctx.save();
    ctx.translate(x, y);
    ctx.rect(0, 0, w, h);
    ctx.clip();
    if ((cut.width < w && cut.width < FloraCutter.MIN_TILE) || (cut.height < h && cut.height < FloraCutter.MIN_TILE)) {
      var tw = Math.floor(FloraCutter.MIN_TILE / cut.width + 1) * cut.width;
      var th = Math.floor(FloraCutter.MIN_TILE / cut.height + 1) * cut.height;
      var ncut = this.cuttingForRect(tw, th);
      var nctx = ncut.image.getContext('2d');
      this.rawTile(cut, nctx, tw, th, 0, 0);
      this.rawTile(ncut, ctx, w, h, MathX.fmodp(xo - cut.width / 2, tw), MathX.fmodp(yo - cut.height, th));
      this.releaseCutting(ncut);
    }
    else {
      this.rawTile(cut, ctx, w, h, MathX.fmodp(xo - cut.width / 2, cut.width), MathX.fmodp(yo - cut.height, cut.height));
    }
    ctx.restore();

    this.releaseCutting(cut);
  },

  makeImage: function(tri, cb, w, h) {
    var cvs = this.canvas_keeper.makeCanvas(w, h);
    this.drawTile(cvs.getContext('2d'), 0, 0, w, h, tri, cb);
    return cvs;
  }

};

module.exports = FloraCutter;
