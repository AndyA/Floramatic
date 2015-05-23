var rconsole = (function() {
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

  return {
    log: function() {
      queue.push(Array.prototype.slice.apply(arguments));
      scheduleSend();
    }
  };

})();
