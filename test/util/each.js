"use strict";

var chai = require("chai");
chai.use(require('chai-subset'));

var expect = chai.expect;

var each = require('../../lib/util/each.js');

describe('each', function() {

  describe('sortedKeys', function() {

    var input = {
      'ae1a0e6c2a6482': 'b03633e5dd48483940',
      '591bdaeb7905fd': 'e19da3bbb317e5a9d1',
      '912684de70df95': '9c565e46cdb0c9fdcf',
      '2ee8179cab97f3': 'a6f0372b0f383529fd',
      '59b00bef80d917': '22c870e3f6a25b329e',
      'b2f6b2f32fac68': '249c339b309b84d1c2',
      '89950411cb522a': '2d3677ce0207016a1e',
      '2f050157629036': 'c4d4254a3758e71c62',
      '94da6549380ce3': '83cc1e12850d72951c',
      'd3e35faaa2385f': 'ea672436ec8ba70e4e',
      '76635918f979dc': 'a2549672eaae1bd11f',
      '20507ad177c1b8': '45d2ee38f14c69da7e',
      '420540fdd3a128': '90ed4827a6054acd0c',
      '03c9b2d947ecdd': '3a716a60b46173982e',
      '1195d302ba2a06': '9ef61b99c010571220',
      'a8e4fae1864c9c': '2636bf92f36acdcf04',
      '356fd932222549': 'dbff718defd967bfa9',
      '193a24c65fd926': 'fc0712386da03250ee',
      'ef9a82e7bfd5e1': '9e3cbd91f98a9b7872',
      '3c9a32058add85': '500c13b33abc8557ba',
      '1718016b9475c2': '82399a723bfa5a4114',
      'a0b819a3d81df7': '59815ba264979aba58',
      'd41d8cd98f00b2': '04e9800998ecf8427e',
      '7ce7b965e30aba': 'ac4443b1170ac9d550',
      '1786d6b7bd7fff': '06233394e82c678946',
      '981dc6114a4780': '1f1dddcd6b2c52f9c4',
      'ae3c949e019780': 'f461b8ff7f1fea28d8',
      '81762286f6adf9': '75c037ab11ebf0994e',
      '74dec397f2dfbd': '92ccce6bee1d3e1b6b',
      'f312e95ad5e40d': '4dfb669e4584f05344',
      '4c3d442b70ff4c': 'e0e971df47036eed16',
      '950a731cfa7f6c': 'c2b1228b5e906877a6',
      'a40865cef64e75': '9120632784fd8d6454',
      'c7c230e6fe2a50': '22331237d423945c4c',
      '16346683ab87b9': '5a6538848a9d30eb51',
      '78658a46839f4e': '5b20aa898417697fa6',
      'c15971dca0fd56': '004ec11a4ab45e63ba',
      'fb587269073384': '7a4a9e5d32ac05979c'
    };

    var output = [
      ['03c9b2d947ecdd', '3a716a60b46173982e'],
      ['1195d302ba2a06', '9ef61b99c010571220'],
      ['16346683ab87b9', '5a6538848a9d30eb51'],
      ['1718016b9475c2', '82399a723bfa5a4114'],
      ['1786d6b7bd7fff', '06233394e82c678946'],
      ['193a24c65fd926', 'fc0712386da03250ee'],
      ['20507ad177c1b8', '45d2ee38f14c69da7e'],
      ['2ee8179cab97f3', 'a6f0372b0f383529fd'],
      ['2f050157629036', 'c4d4254a3758e71c62'],
      ['356fd932222549', 'dbff718defd967bfa9'],
      ['3c9a32058add85', '500c13b33abc8557ba'],
      ['420540fdd3a128', '90ed4827a6054acd0c'],
      ['4c3d442b70ff4c', 'e0e971df47036eed16'],
      ['591bdaeb7905fd', 'e19da3bbb317e5a9d1'],
      ['59b00bef80d917', '22c870e3f6a25b329e'],
      ['74dec397f2dfbd', '92ccce6bee1d3e1b6b'],
      ['76635918f979dc', 'a2549672eaae1bd11f'],
      ['78658a46839f4e', '5b20aa898417697fa6'],
      ['7ce7b965e30aba', 'ac4443b1170ac9d550'],
      ['81762286f6adf9', '75c037ab11ebf0994e'],
      ['89950411cb522a', '2d3677ce0207016a1e'],
      ['912684de70df95', '9c565e46cdb0c9fdcf'],
      ['94da6549380ce3', '83cc1e12850d72951c'],
      ['950a731cfa7f6c', 'c2b1228b5e906877a6'],
      ['981dc6114a4780', '1f1dddcd6b2c52f9c4'],
      ['a0b819a3d81df7', '59815ba264979aba58'],
      ['a40865cef64e75', '9120632784fd8d6454'],
      ['a8e4fae1864c9c', '2636bf92f36acdcf04'],
      ['ae1a0e6c2a6482', 'b03633e5dd48483940'],
      ['ae3c949e019780', 'f461b8ff7f1fea28d8'],
      ['b2f6b2f32fac68', '249c339b309b84d1c2'],
      ['c15971dca0fd56', '004ec11a4ab45e63ba'],
      ['c7c230e6fe2a50', '22331237d423945c4c'],
      ['d3e35faaa2385f', 'ea672436ec8ba70e4e'],
      ['d41d8cd98f00b2', '04e9800998ecf8427e'],
      ['ef9a82e7bfd5e1', '9e3cbd91f98a9b7872'],
      ['f312e95ad5e40d', '4dfb669e4584f05344'],
      ['fb587269073384', '7a4a9e5d32ac05979c']];

    it('should sort lexically without a sorter', function() {

      var got = [];
      each.sortedKeys(input, function(v, k) {
        got.push([k, v]);
      });

      expect(got).to.deep.equal(output);
    });

    it('should sort work with a sorter', function() {

      var got = [];
      each.sortedKeys(input, function(a, b) {
        return a > b ? -1 : a < b ? 1 : 0;
      },
      function(v, k) {
        got.unshift([k, v]);
      });

      expect(got).to.deep.equal(output);
    });

  });

});
