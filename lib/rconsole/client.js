module.exports = (function() {
  "use strict";

  var $ = require('jquery');

  var queue = [];
  var sending = false;
  var pending = false;

  function sendQueue() {
    pending = false;

    if (sending || !queue.length) return;

    var chunk = queue;
    queue = [];
    sending = true;

    $.ajax({
      url: '/rconsole/send',
      method: 'POST',
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify(chunk)
    }).always(function() {
      sending = false;
    }).fail(function() {
      console.log("Failed to send rconsole log");
    }).done(function(resp) {
      sendQueue();
    });
  }

  function scheduleSend() {
    if (!sending && !pending) {
      setTimeout(sendQueue, 100);
      pending = true;
    }
  }

  var passthrough = ['assert', 'dir', 'error', 'info', 'log', 'time', 'timeEnd', 'trace', 'warn']

  var obj = {};
  for (var i = 0; i < passthrough.length; i++) {
    name = passthrough[i];
    obj[name] = (function(n) {
      return function() {
        queue.push({
          m: n,
          a: Array.prototype.slice.apply(arguments)
        });
        if (queue.length == 1) scheduleSend();
      }
    })(name);
  }

  return obj;

})();
