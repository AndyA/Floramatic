module.exports = (function() {
  "use strict";

  var Canvas = require('canvas');
  var FloraCutter = require('../lib/floracutter.js');
  var ZoomPan = require('../lib/zoompan.js');
  var Promise = require('bluebird');
  var fs = Promise.promisifyAll(require('fs'));
  var _ = require('underscore');
  var events = require("events");
  var util = require('util');
  var request = require('request');

  function FloraMovie(filename, opts) {
    events.EventEmitter.call(this);

    this.o = _.extend({},
    {
      fps: 25,
      width: 1920,
      height: 1080,
      maxStill: 1500
    },
    opts || {});

    this.filename = filename;
    this.startTime = null;
    this.lastTime = null;

    this.lastFrame = 0;
    this.curFrame = -1;
    this.curInfo = {};

    this.frames = {};
    this.canvas = null;
    this.out = null;

    this.cutter = new FloraCutter;
    this.zoom = null;

    // Start making frames
    this.makeFrame(0);
  }

  util.inherits(FloraMovie, events.EventEmitter);

  _.extend(FloraMovie.prototype, {
    timeToFrames: function(ts) {
      return Math.floor(ts * this.o.fps / 1000);
    },

    framesToTime: function(fr) {
      return fr * 1000 / this.o.fps;
    },

    getCanvas: function() {
      if (!this.canvas) this.canvas = new Canvas(this.o.width, this.o.height);
      return this.canvas;
    },

    getOutputStream: function() {
      if (!this.out) this.out = fs.createWriteStream(this.filename);
      return this.out;
    },

    getFrameInfo: function(fnum) {
      var fr = this.frames;
      if (!fr.hasOwnProperty(fnum)) fr[fnum] = Promise.pending();
      return fr[fnum];
    },

    writeFrame: function() {
      var ostm = this.getCanvas().jpegStream({
        quality: 100
      });

      var p = new Promise(function(resolve, reject) {
        ostm.on('end', resolve);
        ostm.on('error', reject);
      }).lastly(function() {
        ostm.removeAllListeners();
      });

      ostm.pipe(this.getOutputStream(), {
        end: false
      });

      return p;
    },

    loadImage: function(url) {
      return new Promise(function(resolve, reject) {
        request({
          uri: url,
          encoding: null
        },
        function(err, res) {
          if (err) reject(err);
          else resolve(res);
        });
      }).bind(this).then(function(res) {
        var img = new Canvas.Image;
        img.src = res.body;
        this.zoom = new ZoomPan(img);
        return this.zoom;
      });
    },

    loadImageForInfo: function(info) {
      if (info.img) return this.loadImage(info.img);
      return Promise.resolve(this.zoom);
    },

    makeFrame: function(fnum) {
      return this.getFrameInfo(fnum).promise.bind(this).then(function(info) {
        console.log('frame:', fnum, 'info:', info);
        if (info.nop) return info;
        return this.loadImageForInfo(info).bind(this).then(function(zoom) {
          var canvas = this.getCanvas();
          var ctx = canvas.getContext('2d');

          zoom.setOffset(info.zoom.x, info.zoom.y);
          zoom.setScale(info.zoom.scale);

          console.log('Rendering', fnum);
          this.cutter.drawTile(ctx, 0, 0, canvas.width, canvas.height, info.tri, function(cx) {
            zoom.draw(cx);
          });
          return info;
        });
      }).then(function(info) {
        if (info.end) {
          if (this.out) this.out.end();
          console.log("Movie ended");
          return true;
        }
        return this.writeFrame().bind(this).then(function() {
          return this.makeFrame(fnum + 1);
        });
      });
    },

    setFrameInfo: function(fnum, info) {
      if (fnum < this.curFrame) throw new Error('Frames went backwards: ' + fnum + ' < ' + this.curFrame);
      if (fnum > this.curFrame) {
        for (var ifn = this.lastFrame; ifn < this.curFrame; ifn++) this.getFrameInfo(ifn).fulfill({
          nop: true
        });
        this.getFrameInfo(this.curFrame).fulfill(this.curInfo);
        this.lastFrame = this.curFrame + 1;
        this.curFrame = fnum;
        this.curInfo = {};
      }

      _.extend(this.curInfo, info);
    },

    setFrame: function(ts, info) {
      if (this.startTime === null) this.startTime = ts;
      var rel = ts - this.startTime;

      // enforce maxStill
      if (this.lastTime !== null && rel - this.lastTime > this.o.maxStill) {
        this.startTime += rel - this.lastTime - this.o.maxStill;
        rel = ts - this.startTime;
      }

      var fnum = this.timeToFrames(rel);
      this.setFrameInfo(fnum, info);

      this.lastTime = rel;
    },

    setImage: function(ts, img) {
      this.setFrame(ts, {
        img: img
      });
    },

    setTriangle: function(ts, tri) {
      this.setFrame(ts, {
        tri: tri
      });
    },

    setZoom: function(ts, zoom) {
      this.setFrame(ts, {
        zoom: zoom
      });
    },

    end: function() {
      this.setFrameInfo(this.curFrame + 1, {
        end: true
      });
    },
  });

  return FloraMovie;
})();
