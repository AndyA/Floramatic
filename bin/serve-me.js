"use strict";

var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var manifest = require('../lib/manifest.js');
var builder = require('../lib/builder.js');
var rconsole = require('../lib/rconsole/server.js');

var WEBROOT = 'www';

var args = process.argv.slice(2);

var artroot = WEBROOT + '/art';
if (args.length) artroot = args[0];

builder(['lib/floramatic.js'], 'www/js/main.js');

app.use(bodyParser.json())

app.use('/rconsole', rconsole);

if (1) app.use(require('../lib/ui-movie.js'));

//app.use(function(err, req, res, next) {
//  var msg = err.msg || '500 - Internal Server Error';
//  res.status(500).send({
//    error: msg
//  });
//});
app.get('/art/manifest.json', function(req, res, next) {
  manifest(artroot, /\.(?:png|jpeg|jpg)$/i, '/art').then(function(mani) {
    res.send(mani);
  });
});

app.use('/art', express.static(artroot));
app.use(express.static(WEBROOT));

app.listen(3000);
