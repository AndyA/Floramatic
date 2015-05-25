"use strict";

var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var manifest = require('../lib/manifest.js');

var WEBROOT = 'www';

var args = process.argv.slice(2);

var artroot = WEBROOT + '/art';
if (args.length) artroot = args[0];

app.use(bodyParser.json())

app.use(function(err, req, res, next) {
  var msg = err.msg || '500 - Internal Server Error';
  res.send(500, {
    error: msg
  });
});

app.get('/art/manifest.json', function(req, res, next) {
  manifest(artroot, /\.(?:png|jpeg|jpg)$/i, '/art').then(function(mani) {
    res.send(mani);
  });
});

app.post('/rconsole/send', function(req, res) {
  var lines = req.body;
  for (var i = 0; i < lines.length; i++) {
    console[lines[i].m].apply(console, lines[i].a);
  }
  res.send({
    status: 'OK'
  });
});

app.use('/art', express.static(artroot));
app.use(express.static(WEBROOT));

app.listen(3000);
