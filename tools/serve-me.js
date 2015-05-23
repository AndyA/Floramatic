"use strict";

var express = require('express');
var bodyParser = require('body-parser')
var app = express();

app.use(express.static('www'));
app.use(bodyParser.json())

app.get('/rconsole/send', function(req, res) {
  console.log(req.body);
  res.send({
    status: 'OK'
  });
});

app.listen(3000);
