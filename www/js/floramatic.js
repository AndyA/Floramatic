$(function() {

  var manifest = 'art/manifest.json';
  var current = "Lilium";

  var $canvas = $('#source');
  var canvas = $canvas[0];
  var context = canvas.getContext('2d');

  var metrics = {
    handle_radius: 10
  };

  var triangle = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    r: Math.min(canvas.width, canvas.height) / 3,
    a: 0
  };

  function makeCorners(tri) {
    var corn = [];
    var a = tri.a;
    for (var i = 0; i < 3; i++) {
      corn.push({
        x: Math.cos(a) * tri.r + tri.x,
        y: Math.sin(a) * tri.r + tri.y
      });
      a += Math.PI * 2 / 3;
    }
    return corn;
  }

  function controlCircle(ctx, x, y) {
    ctx.moveTo(x + metrics.handle_radius, y);
    ctx.arc(x, y, metrics.handle_radius, 0, 2 * Math.PI);
  }

  function drawTriangle(ctx, tri) {
    ctx.lineWidth = 3;
    var corners = makeCorners(tri);
    ctx.beginPath();

    var prev_dot = corners[corners.length - 1];
    var a = tri.a;
    for (var i = 0; i < corners.length; i++) {
      var dot = corners[i];

      var dx = Math.cos(a + Math.PI / 6) * metrics.handle_radius
      var dy = Math.sin(a + Math.PI / 6) * metrics.handle_radius;

      ctx.moveTo(prev_dot.x + dx, prev_dot.y + dy);
      ctx.lineTo(dot.x - dx, dot.y - dy);

      controlCircle(ctx, dot.x, dot.y);
      prev_dot = dot;
      a += Math.PI * 2 / 3;
    }

    controlCircle(ctx, tri.x, tri.y);

    ctx.stroke();
  }

  function inCircle(cx, cy, cr, x, y) {
    var dx = x - cx;
    var dy = y - cy;
    return dx * dx + dy * dy <= cr * cr
  }

  function decodeClick(tri, x, y) {
    if (inCircle(tri.x, tri.y, metrics.handle_radius, x, y)) return {
      dx: x - tri.x,
      dy: y - tri.y,
      pt: 4
    };

    var corners = makeCorners(tri);
    for (var i = 0; i < corners.length; i++) {
      var dot = corners[i];
      if (inCircle(dot.x, dot.y, metrics.handle_radius, x, y)) return {
        dx: x - dot.x,
        dy: y - dot.y,
        pt: i
      };
    }

    return null;
  }

  function redraw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawTriangle(context, triangle);
  }

  $canvas.mousedown(function(e) {
    var hit = decodeClick(triangle, e.offsetX, e.offsetY);
    if (hit) {
      $canvas.mousemove(function(e) {
        var x = e.offsetX - hit.dx;
        var y = e.offsetY - hit.dy;
        if (hit.pt == 4) {
          triangle.x = x;
          triangle.y = y;
        } else {
          var dx = x - triangle.x;
          var dy = y - triangle.y;
          triangle.r = Math.sqrt(dx * dx + dy * dy);
          triangle.a = Math.atan2(dy, dx) - Math.PI * 2 * hit.pt / 3;;
        }
        redraw();
      });

      $('body').mouseup(function(e) {
        $canvas.off('mousemove');
        $(this).off('mouseup');
      });
    }
  });

  redraw();

  $.ajax({
    url: manifest,
    dataType: 'json'
  }).done(function(mani) {
    var $img = $('<img></img>').load(function() {
      console.log("image loaded");
    }).attr({
      src: 'art/' + mani[current]
    });
  }).fail(function() {
    console.log("Can't load " + manifest);
  });

});
