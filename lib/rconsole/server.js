module.exports = (function() {
  "use strict";

  var express = require('express');

  var app = express();

  app.post('/send', function(req, res) {
    var lines = req.body;
    for (var i = 0; i < lines.length; i++) {
      console[lines[i].m].apply(console, lines[i].a);
    }
    res.send({
      status: 'OK'
    });
  });

  return app;

})();
