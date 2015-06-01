"use strict";

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var Canvas = require('canvas');
var Benchmark = require('benchmark');
var uuid = require('node-uuid');

var width = 1920;
var height = 1080;
var img_src = 'www/art/7030916-red-flower-backgrounds.jpg';

function loadImage(src) {
  var img = new Canvas.Image;
  return new Promise(function(resolve, reject) {
    img.onload = resolve;
    img.onerror = reject;
    img.src = src;
  }).then(function() {
    return img
  });
}

function suck(stm) {
  stm.on('data', function(chunk) {});
  return new Promise(function(resolve, reject) {
    stm.on('end', resolve);
    stm.on('error', reject);
  });
}

function pipe(istm, ostm) {
  return new Promise(function(resolve, reject) {
    istm.on('end', resolve);
    istm.on('error', reject);
    istm.pipe(ostm, {
      end: false
    });
  }).lastly(function() {
    istm.removeAllListeners();
  });
}

function outFile() {
  var name = uuid.v4() + '.tmp';
  console.log('writing', name);
  return fs.createWriteStream(name);
}

function withOutFile(times, fn) {
  var p = Promise.resolve(outFile());
  for (var i = 0; i < times; i++) {
    p = p.then(fn);
  }
  return p.then(function(ostm) {
    return new Promise(function(resolve, reject) {
      ostm.on('finish', resolve);
      ostm.on('error', reject);
      ostm.end();
    });
  });
}

function bm(suite) {
  suite.on('cycle', function(event) {
    console.log(String(event.target));
  }).on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').pluck('name'));
  }).run();
}

var canvas = new Canvas(width, height);
var ctx = canvas.getContext('2d');

loadImage(img_src).then(function(img) {
  console.log('image loaded:', img.width, 'x', img.height);
  ctx.drawImage(img, 0, 0, img.width, img.height);
}).then(function() {

  return;

  console.log('get image contents');

  var suite = new Benchmark.Suite;

  suite.add('toBuffer', function() {
    // Get the whole buffer
    canvas.toBuffer();
  }).add('pngStream', function(deferred) {
    var stm = canvas.pngStream();
    suck(stm).then(function() {
      deferred.resolve();
    });
  },
  {
    defer: true
  }).add('jpegStream', function(deferred) {
    var stm = canvas.jpegStream();
    suck(stm).then(function() {
      deferred.resolve();
    });
  },
  {
    defer: true
  }).add('jpegStream (q=100)', function(deferred) {
    var stm = canvas.jpegStream({
      quality: 100
    });
    suck(stm).then(function() {
      deferred.resolve();
    });
  },
  {
    defer: true
  });

  bm(suite);

}).then(function() {

  console.log('dump image to file');

  var suite = new Benchmark.Suite;

  suite.add('toBuffer', function(deferred) {
    withOutFile(10, function(ostm) {
      console.log('write buffer');
      var buf = canvas.toBuffer();
      ostm.write(buf);
      return ostm;
    }).then(function() {
      deferred.resolve()
    });
  },
  {
    defer: true
  }).add('jpegStream', function(deferred) {
    withOutFile(10, function(ostm) {
      console.log('pipe jpeg');
      var stm = canvas.jpegStream({
        quality: 100
      });
      return pipe(stm, ostm).then(function() {
        return ostm;
      });
    }).then(function() {
      deferred.resolve()
    });
  },
  {
    defer: true
  });

  bm(suite);

});
