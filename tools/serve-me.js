"use strict";

var express = require('express');
var bodyParser = require('body-parser')
var app = express();

app.use(express.static('www'));
app.use(bodyParser.json())

app.post('/rconsole/send', function(req, res) {
  var lines = req.body;
  for (var i = 0; i < lines.length; i++) {
    console[lines[i].m].apply(console, lines[i].a);
  }
  res.send({
    status: 'OK'
  });
});

app.listen(3000);
