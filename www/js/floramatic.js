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

  var controls = null;
  var triangle = null;
  var slider = null;

  var zoom = null;
  var image = null;

  function redraw() {
    src_ctx.save();
    dst_ctx.save();

    src_ctx.clearRect(0, 0, src_cvs.width, src_cvs.height);
    dst_ctx.clearRect(0, 0, dst_cvs.width, dst_cvs.height);

    if (controls) {
      src_ctx.save();
      zoom.setupContext(src_ctx);
      src_ctx.drawImage(image, 0, 0);
      src_ctx.restore();

      var cutting = triangle.sample(image, zoom);
      triangle.tile(cutting, dst_ctx, dst_cvs.width, dst_cvs.height, dst_cvs.width / 2, dst_cvs.height / 2);
      triangle.releaseCutting(cutting);

      controls.draw(src_ctx);
    }

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

    redraw();
  }

  function makeControls() {
    $source.off('mousedown.main'); // if reloading
    controls = new Controls(src_cvs);

    var radius = Math.min(src_cvs.width, src_cvs.height) / 5;
    triangle = new Triangle(0, 0, radius, 0);
    controls.add(triangle);

    slider = new Slider(0, -30, {
      min: -500,
      max: 500,
      width: 200
    });
    slider.setOrigin(0.5, 1);

    controls.add(slider);

    $source.on('mousedown.main', function(e) {
      if (e.which != 1) return;
      if (!zoom) return;

      var x = e.pageX - $(e.target).offset().left;
      var y = e.pageY - $(e.target).offset().top;

      var init_x = x;
      var init_y = y;
      var init_zoom = zoom.getState();

      $source.mousemove(function(e) {
        var x = e.pageX - $(e.target).offset().left;
        var y = e.pageY - $(e.target).offset().top;
        zoom.setOffset(init_zoom.x + (x - init_x) / init_zoom.scale, init_zoom.y + (y - init_y) / init_zoom.scale);
        controls.redraw();
      });

      $('body').mouseup(function(e) {
        $source.off('mousemove');
        $(this).off('mouseup');
      });

    });
  }

  function setImage(img) {
    console.log('setImage: ', img);
    image = img;
    zoom = new ZoomPan(src_cvs.width, src_cvs.height, img.width, img.height);
    makeControls();
    redraw();
  }

  function loadImage(url) {
    var $img = $('<img></img>').load(function() {
      setImage($img[0]);
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

  $source.on('redraw', function(e) {
    redraw();
  }).on('slide', function(e, ui) {
    if (zoom) {
      var scale = Math.pow(2, ui.value / 100);
      zoom.setScale(scale);
    }
  });

  $destination.mousedown(function(e) {
    if (e.which != 1) return;
    if (triangle) {
      var size = Math.max(dst_cvs.width, dst_cvs.height) * 1.5;
      var canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;

      var cutting = triangle.sample(image, zoom);
      triangle.tile(cutting, canvas.getContext('2d'), canvas.width, canvas.height, canvas.width / 2, canvas.height / 2);
      triangle.releaseCutting(cutting);
      setImage(canvas);
    }
  });

  resize();

});
