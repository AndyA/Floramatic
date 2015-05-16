$(function() {

  var manifest = 'art/manifest.json';
  var current = "Lilium";

  var $source = $('#source');
  var src_canvas = $source[0];
  var src_ctx = src_canvas.getContext('2d');

  var $destination = $('#destination');
  var dst_canvas = $destination[0];
  var dst_ctx = dst_canvas.getContext('2d');

  var metrics = {
    handle_radius: 10
  };

  var triangle = {
    x: src_canvas.width / 2,
    y: src_canvas.height / 2,
    r: Math.min(src_canvas.width, src_canvas.height) / 3,
    a: 0
  };

  var image = {
    x: 0,
    y: 0,
    i: null
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
    ctx.strokeStyle = 'white';
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

  function sample(ctx, img, tri) {
    if (!image.i) return;

    var csize = tri.r * 2;

    var buf = document.createElement('canvas');
    buf.width = buf.height = csize;

    var bctx = buf.getContext('2d');
    bctx.drawImage(image.i, img.x - tri.x + tri.r, img.y - tri.y + tri.r);
    bctx.globalCompositeOperation = 'destination-in';
    var stri = {
      x: tri.r,
      y: tri.r,
      r: tri.r,
      a: tri.a
    };

    var corners = makeCorners(stri);
    bctx.beginPath();
    for (var i = 0; i < corners.length; i++) {
      var dot = corners[i];
      if (i == 0) bctx.moveTo(dot.x, dot.y);
      else bctx.lineTo(dot.x, dot.y);
    }
    bctx.fill();

    dst_ctx.clearRect(0, 0, dst_canvas.width, dst_canvas.height);
    dst_ctx.drawImage(buf, (dst_canvas.width - csize) / 2, (dst_canvas.height - csize) / 2);
  }

  function redraw() {
    src_ctx.clearRect(0, 0, src_canvas.width, src_canvas.height);
    if (image.i) {
      src_ctx.drawImage(image.i, image.x, image.y);
    }
    drawTriangle(src_ctx, triangle);
    sample(src_ctx, image, triangle);
  }

  $.ajax({
    url: manifest,
    dataType: 'json'
  }).done(function(mani) {
    var $img = $('<img></img>').load(function() {
      image.i = $img[0];
      redraw();
    }).attr({
      src: 'art/' + mani[current]
    });
  }).fail(function() {
    console.log("Can't load " + manifest);
  });

  $source.mousedown(function(e) {
    var hit = decodeClick(triangle, e.offsetX, e.offsetY);
    if (hit) {
      $source.mousemove(function(e) {
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
        $source.off('mousemove');
        $(this).off('mouseup');
      });
    }
  });

  redraw();

});
