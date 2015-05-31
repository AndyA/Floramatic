module.exports = (function() {
  "use strict";

  var _ = require('underscore');
  var events = require("events");
  var express = require('express');
  var util = require('util');

  var TTL = 15000; // end after 15s of inactivity
  var session = {};

  var app = express();
  _.extend(app, events.EventEmitter.prototype);

  function Session(id) {
    events.EventEmitter.call(this);
    this.id = id;
    this.keepAlive();
  }

  util.inherits(Session, events.EventEmitter);

  _.extend(Session.prototype, {
    keepAlive: function() {
      this.lastSeen = (new Date).getTime();
    },

    handleEvent: function(ev) {
      this.keepAlive();
      this.emit('event', ev);
    },

    end: function() {
      this.emit('end');
      this.removeAllListeners();
    }
  });

  function reapSessions() {
    var cutoff = (new Date).getTime() - TTL;
    var reaped = _.filter(session, function(s) {
      return s.lastSeen < cutoff
    });
    _.each(reaped, function(s) {
      s.end();
      delete session[s.id];
    });
  }

  function findSession(id) {
    if (session.hasOwnProperty(id)) return session[id];
    session[id] = new Session(id);
    app.emit('newSession', session[id]);
    return session[id];
  }

  function handleEvent(ev) {
    var s = findSession(ev.id);
    s.handleEvent(ev);
  }

  setInterval(reapSessions, 250);

  app.post('/send', function(req, res) {
    for (var i = 0; i < req.body.length; i++) handleEvent(req.body[i]);
    res.send({
      status: 'OK'
    });
  });

  return app;

})();
