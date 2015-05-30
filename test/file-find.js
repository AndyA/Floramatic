"use strict";

var chai = require("chai");
chai.use(require('chai-subset'));
var Q = require('q');

var tempfs = require('./lib/temp-fs.js');

var expect = chai.expect;
var find = require('../lib/file-find.js');
var path = require('path');

function relList(root, files) {
  return files.map(function(fn) {
    return path.relative(root, fn)
  });
}

describe('file-find', function() {

  it('should scan an empty dir', function(done_it) {
    tempfs({}).then(function(root) {

      return find(root).then(function(files) {
        expect(files).to.be.empty;
      });

    }).done(done_it);

  });

  describe('simple fs', function() {

    var fs_root;

    before(function(done_it) {
      tempfs({
        'a': 'This is a',
        'b': 'This is b',
        'c': {
          'd': 'This is c/d',
          'e': 'This is c/e'
        },
        'f': {
          'g': 'This is f/g',
          'h': 'This is f/h'
        }
      }).then(function(root) {
        fs_root = root;
      }).done(done_it);
    });

    it('should scan a simple dir', function(done_it) {
      find(fs_root).then(function(files) {
        var rel = relList(fs_root, files);
        expect(rel).to.deep.equal(['a', 'b', 'c/d', 'c/e', 'f/g', 'f/h']);
      }).done(done_it);

    });

    it('should filter on a RegExp', function(done_it) {
      find(fs_root, /[ae]$/).then(function(files) {
        var rel = relList(fs_root, files);
        expect(rel).to.deep.equal(['a', 'c/e']);
      }).done(done_it);

    });

  });

});
