"use strict";

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var Canvas = require('canvas');
var FloraCutter = require('../lib/floracutter.js');

var src_img = 'www/art/590ee0064177579d8a2f9e907d393c99.jpg';
var canvas = new Canvas(1920, 1080);
var ctx = canvas.getContext('2d');

var cutter = new FloraCutter;

var out = fs.createWriteStream('out.mjpeg');

function makeFrame(fno, img) {

  var tri = {
    x: Math.sin((fno + 10) * 0.019) * Math.sin(fno * 0.0012) * (img.width / 5),
    y: Math.sin((fno + 20) * 0.013) * Math.sin(fno * 0.008) * (img.height / 5),
    a: Math.sin((fno + 30) * 0.0071) * Math.sin(fno * 0.013) * Math.PI,
    r: (Math.sin(fno * 0.003) * Math.sin(fno * 0.0018) + 1.05) * 90,
    xo: Math.sin((fno + 40) * 0.021) * Math.sin(fno * 0.0011) * 300,
    yo: Math.sin((fno + 50) * 0.039) * Math.sin(fno * 0.0093) * 300
  };

  console.log('frame ' + fno + ', args: ' + JSON.stringify(tri));

  cutter.drawTile(ctx, 0, 0, canvas.width, canvas.height, tri, function(cx) {
    cx.translate((canvas.width - img.width) / 2, (canvas.height - img.height) / 2);
    cx.drawImage(img, 0, 0, img.width, img.height);
  });

  var ostm = canvas.jpegStream({
    quality: 100
  });

  var p = new Promise(function(resolve, reject) {
    ostm.on('end', resolve);
    ostm.on('error', reject);
  });

  ostm.pipe(out, {
    end: false
  });

  return p;
}

function makeMovie(frames, source) {

  var img = new Canvas.Image;

  var res = fs.readFileAsync(source).then(function(ibuf) {
    img.src = ibuf;
  });

  for (var fno = 0; fno < frames; fno++) {
    res = (function(fn) {
      return res.then(function() {
        return makeFrame(fn, img).delay(10);
      });
    })(fno);
  }

  return res;
}

makeMovie(5000, src_img).then(function() {
  out.end()
}).done();
