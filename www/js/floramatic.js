$(function() {

  var manifest = 'art/manifest.json';
  //  var current = "Blue Spikes";
  //  var current = "Deep Blue";
  //  var current = "Hippie";
  //  var current = "Lilium";
  var current = "Orange";
  //  var current = "Purple Rose";
  //  var current = "Red Spikes";
  var $source = $('#source');
  var src_cvs = $source[0];
  var src_ctx = src_cvs.getContext('2d');

  var $destination = $('#destination');
  var dst_cvs = $destination[0];
  var dst_ctx = dst_cvs.getContext('2d');

  var triangle = new Triangle(src_cvs.width / 2, src_cvs.height / 2, Math.min(src_cvs.width, src_cvs.height) / 5, 0);
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
      while (cutting.r < dim) {
        cutting = triangle.expand(cutting);
      }
      dst_ctx.translate(dst_cvs.width / 2 - cutting.centre_x, dst_cvs.height / 2 - cutting.centre_y);
      dst_ctx.drawImage(cutting.image, 0, 0);
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
      image = $img[0];
      zoom = new ZoomPan(src_cvs.width, src_cvs.height, image.width, image.height);
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
