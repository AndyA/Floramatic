"use strict";

var chai = require("chai");
chai.use(require('chai-subset'));
var expect = chai.expect;

var CanvasKeeper = require('../lib/canvaskeeper');

describe('CanvasKeeper', function() {

  it('should make a canvas', function() {

    var cc = new CanvasKeeper();
    var canvas = cc.getCanvas(100, 200);

    expect(canvas.width).to.be.at.least(100);
    expect(canvas.height).to.be.at.least(200);

  });

});
