module.exports = (function() {
  "use strict";

  var express = require('express');
  var ui_sender = require('../lib/ui-sender/server.js');
  var FloraMovie = require('../lib/floramovie.js');

  var app = express();

  ui_sender.on('newSession', function(sess) {
    console.log('newSession:', sess.id);
    var fm = new FloraMovie(sess.id + '.mp4');
    sess.on('event', function(ev) {
      if (ev.ev.image) fm.setImage(ev.ts, ev.ev.image);
      if (ev.ev.triangle) fm.setTriangle(ev.ts, ev.ev.triangle);
      if (ev.ev.zoom) fm.setZoom(ev.ts, ev.ev.zoom);
    });
    sess.on('end', function() {
      console.log('session ' + sess.id + ' ended');
      fm.end();
    });
  });

  app.use('/ui', ui_sender);
  app.get('/config.json', function(req, res, next) {
    res.send({
      ui: {
        endpoint: '/ui/send'
      }
    });
  });

  return app;

})();
