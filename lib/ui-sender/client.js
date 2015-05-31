"use strict";

module.exports = function(endpoint) {
  var $ = require('jquery');
  var uuid = require('node-uuid');
  var Promise = require('bluebird');

  var queue = [];
  var id = uuid.v4();

  function postQueue() {
    Promise.delay(250).then(function() {
      if (queue.length) {
        var chunk = queue;
        queue = [];
        return Promise.resolve($.ajax({
          url: endpoint,
          method: 'POST',
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          data: JSON.stringify(chunk)
        }));
      }
    }).caught(function(xhr) {
      console.log('send failed: ', xhr);
    }).lastly(postQueue);
  }

  postQueue();

  function sendEvent(ev) {
    queue.push({
      ev: ev,
      id: id,
      ts: (new Date).getTime()
    });
  };

  // Send a keepalive every 5 seconds
  setInterval(function() {
    sendEvent({
      keepalive: true
    });
  },
  5000);

  this.sendEvent = sendEvent;
}
