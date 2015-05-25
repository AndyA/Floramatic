"use strict";

var chai = require("chai");
chai.use(require('chai-subset'));

var expect = chai.expect;

var Dynaprop = require('../lib/dynaprop.js');

describe('Dynaprop', function() {

  it("should handle defineProperty", function() {
    expect(Dynaprop).to.respondTo('defineProperty');
  });

});
