$(function() {

  var manifest = 'art/manifest.json';
  //  var current = "Blue Spikes";
  //  var current = "Deep Blue";
  //  var current = "Hippie";
  var current = "Lilium";
  //  var current = "Orange";
  //  var current = "Purple Rose";
  //  var current = "Red Spikes";
  var $source = $('#source');
  var src_cvs = $source[0];
  var src_ctx = src_cvs.getContext('2d');

  var $destination = $('#destination');
  var dst_cvs = $destination[0];
  var dst_ctx = dst_cvs.getContext('2d');

  var controls = new Controls(src_cvs);
  var triangle = null;
  var slider = new Slider(0, -30, {
    min: -500,
    max: 500,
    width: 200
  });

  slider.setOrigin(0.5, 1);
  controls.add(slider);

  var zoom = null;
  var image = null;

  function redraw() {
    src_ctx.save();
    dst_ctx.save();

    src_ctx.clearRect(0, 0, src_cvs.width, src_cvs.height);
    dst_ctx.clearRect(0, 0, dst_cvs.width, dst_cvs.height);

    if (image) {

      src_ctx.save();
      zoom.setupContext(src_ctx);
      src_ctx.drawImage(image, 0, 0);
      src_ctx.restore();

      var cutting = triangle.sample(image, zoom);
      var dim = Math.max(dst_cvs.width, dst_cvs.height) * 1.4;

      var rot = 0;
      while (cutting.r < dim) {
        cutting = triangle.expand(cutting);
        rot++;
      }

      dst_ctx.translate(dst_cvs.width / 2, dst_cvs.height / 2);
      if (rot % 2) dst_ctx.rotate(Math.PI);
      dst_ctx.drawImage(cutting.image, -cutting.centre_x, -cutting.centre_y);
      triangle.releaseCutting(cutting);
    }

    controls.draw(src_ctx);

    dst_ctx.restore();
    src_ctx.restore();
  }

  function resize() {
    $('.canvas-wrapper').each(function() {
      var $this = $(this);
      var $canvas = $this.find('canvas');
      $canvas.attr({
        width: $this.width(),
        height: $this.height()
      });
    });

    if (zoom) zoom.setCanvasSize(src_cvs.width, src_cvs.height);
    if (!triangle) {
      var radius = Math.min(src_cvs.width, src_cvs.height) / 5;
      triangle = new Triangle(0, 0, radius, 0);
      controls.add(triangle);
    }
    redraw();
  }

  function loadImage(url) {
    var $img = $('<img></img>').load(function() {
      image = $img[0];
      zoom = new ZoomPan(src_cvs.width, src_cvs.height, image.width, image.height);
      redraw();
    }).attr({
      src: 'art/' + url
    });
  }

  function loadRandom(mani) {
    var keys = Object.keys(mani);
    var pick = Math.floor(Math.random() * keys.length);
    loadImage(mani[keys[pick]]);
  }

  $(window).resize(function() {
    resize();
  });

  $.ajax({
    url: manifest,
    dataType: 'json'
  }).done(function(mani) {
    loadRandom(mani);
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

    function getOffset(e) {
      return {
        x: (e.offsetX || e.pageX - $(e.target).offset().left),
        y: (e.offsetY || e.pageY - $(e.target).offset().top)
      }
    }

    var ofs = getOffset(e);

    var init_x = ofs.x;
    var init_y = ofs.y;
    var init_zoom = zoom.getState();

    //    var hit = triangle.decodeClick(init_x, init_y);
    var hit = controls.decodeClick(init_x, init_y);
    $source.mousemove(function(e) {
      var ofs = getOffset(e);
      if (hit === null) {
        zoom.setOffset(init_zoom.x + ofs.x - init_x, init_zoom.y + ofs.y - init_y);
      }
      else {
        if (controls.dragging == triangle) {
          var cofs = controls.tmpDraggingControlOffset(ofs.x, ofs.y);
          var x = cofs.x - hit.dx;
          var y = cofs.y - hit.dy;
          if (hit.pt == 4) {
            triangle.setCentre(x, y);
          } else {
            var dx = x - triangle.x;
            var dy = y - triangle.y;
            if (hit.pt == 0 || hit.pt == 1) {
              triangle.setRadius(Math.sqrt(dx * dx + dy * dy));
            }
            if (hit.pt == 1 || hit.pt == 2) {
              triangle.setAngle(Math.PI / 2 - Math.PI * 2 * hit.pt / 3 - Math.atan2(dy, dx));
            }
          }
        }
      }
      redraw();
    });

    $('body').mouseup(function(e) {
      controls.endDrag();
      $source.off('mousemove');
      $(this).off('mouseup');
    });
  });

  resize();

});
