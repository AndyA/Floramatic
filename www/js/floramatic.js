$(function() {

  var manifest = 'art/manifest.json';
  var current = "Lilium";

  var $source = $('#source');
  var src_cvs = $source[0];
  var src_ctx = src_cvs.getContext('2d');

  var $destination = $('#destination');
  var dst_cvs = $destination[0];
  var dst_ctx = dst_cvs.getContext('2d');

  var metrics = {
    handle_radius: 10,
    squeeze: 0.5
  };

  var triangle = new Triangle(src_cvs.width / 2, src_cvs.height / 2, Math.min(src_cvs.width, src_cvs.height) / 3, 0);
  var zoom = null;

  var image = {
    x: 0,
    y: 0,
    i: null
  };

  function makeCanvas(w, h) {
    var cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    return cvs
  }

  function sample(ctx, img, tri) {
    if (!image.i) return;

    var csize = tri.r * 2;

    var buf = makeCanvas(csize, csize);
    var bctx = buf.getContext('2d');
    bctx.drawImage(img.i, img.x - tri.x + tri.r, img.y - tri.y + tri.r);
    bctx.globalCompositeOperation = 'destination-in';

    var stri = new Triangle(tri.r, tri.r, tri.r, tri.a);

    stri.fill(bctx);

    return {
      canvas: buf,
      tri: stri
    };
  }

  function tileTriangle(ctx, img, tri) {
    var base_height = Math.sin(Math.PI / 6) * tri.r;

    ctx.save();
    ctx.rotate(tri.a);
    ctx.drawImage(img, -tri.r, -tri.r);
    ctx.restore();

    for (var i = 0; i < 3; i++) {
      var rot = i * Math.PI * 2 / 3;
      ctx.save();
      ctx.rotate(rot);
      ctx.scale(1, -1);
      ctx.translate(0, base_height * 2);
      ctx.rotate(tri.a - rot);
      ctx.drawImage(img, -tri.r, -tri.r);
      ctx.restore();
    }
  }

  function doubleTriangle(img, tri) {
    var buf = makeCanvas(img.width * 2, img.height * 2);

    var ctx = buf.getContext('2d');
    ctx.save();

    ctx.translate(img.width, img.height);
    ctx.rotate(Math.PI);

    tileTriangle(ctx, img, tri);
    ctx.restore();

    return {
      canvas: buf,
      tri: new Triangle(tri.x * 2, tri.y * 2, tri.r * 2, 0)
    }
  }

  function redraw() {
    src_ctx.save();
    dst_ctx.save();
    src_ctx.clearRect(0, 0, src_cvs.width, src_cvs.height);
    var dim = Math.max(src_cvs.width, src_cvs.height);
    if (image.i) {

      src_ctx.save();
      zoom.setupContext(src_ctx);
      src_ctx.drawImage(image.i, 0, 0);
      src_ctx.restore();

      dst_ctx.clearRect(0, 0, dst_cvs.width, dst_cvs.height);

      if (0) {
        var rot = 0;
        var root = sample(src_ctx, image, triangle);
        while (root.tri.r < dim / 1.5) {
          root = doubleTriangle(root.canvas, root.tri);
          rot = 1 - rot;
        }
        dst_ctx.translate(dst_cvs.width / 2, dst_cvs.height / 2);
        dst_ctx.rotate(Math.PI * rot);
        tileTriangle(dst_ctx, root.canvas, root.tri);
      }
      else {
        var samp = triangle.sample(image.i, zoom);
        dst_ctx.translate(dst_cvs.width / 2 - samp.cx, dst_cvs.height / 2 - samp.cy);
        dst_ctx.drawImage(samp.image, 0, 0);

      }
    }
    triangle.drawController(src_ctx);
    dst_ctx.restore();
    src_ctx.restore();
  }

  $.ajax({
    url: manifest,
    dataType: 'json'
  }).done(function(mani) {
    var $img = $('<img></img>').load(function() {
      image.i = $img[0];
      zoom = new ZoomPan(src_cvs.width, src_cvs.height, image.i.width, image.i.height);
      redraw();
    }).attr({
      src: 'art/' + mani[current]
    });
  }).fail(function() {
    console.log("Can't load " + manifest);
  });

  $('.slider.scale').slider({
    min: -500,
    max: 500
  }).on('slide', function(e, ui) {
    if (zoom) {
      var scale = Math.pow(2, ui.value / 100);
      zoom.setScale(scale);
      redraw();
    }
  });

  $source.mousedown(function(e) {
    if (!zoom) return;

    var init_x = e.offsetX;
    var init_y = e.offsetY;
    var init_zoom = zoom.getState();

    var hit = triangle.decodeClick(init_x, init_y);
    $source.mousemove(function(e) {

      if (hit === null) {
        zoom.setOffset(init_zoom.x + e.offsetX - init_x, init_zoom.y + e.offsetY - init_y);
      }
      else {
        var x = e.offsetX - hit.dx;
        var y = e.offsetY - hit.dy;
        if (hit.pt == 4) {
          triangle.setCentre(x, y);
        } else {
          var dx = x - triangle.x;
          var dy = y - triangle.y;
          triangle.setRadius(Math.sqrt(dx * dx + dy * dy));
          triangle.setAngle(Math.PI / 2 - Math.PI * 2 * hit.pt / 3 - Math.atan2(dy, dx));
        }
      }
      redraw();
    });

    $('body').mouseup(function(e) {
      $source.off('mousemove');
      $(this).off('mouseup');
    });
  });

  redraw();

});
