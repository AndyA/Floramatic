var rconsole = (function() {
  var queue = [];
  var sending = false;

  function sendQueue() {
    if (sending || !queue.length) return;
    var chunk = queue;
    queue = [];

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
    if (!sending) setTimeout(sendQueue, 100);
  }

  return {
    log: function() {
      queue.push(Array.prototype.slice.apply(arguments));
      scheduleSend();
    }
  };

})();
