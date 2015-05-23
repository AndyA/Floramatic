$(function() {

  var manifest = 'art/manifest.json';

  var $source = $('#source');
  var src_cvs = $source[0];
  var src_ctx = src_cvs.getContext('2d');

  var $destination = $('#destination');
  var dst_cvs = $destination[0];
  var dst_ctx = dst_cvs.getContext('2d');

  var quantiser = new Quantiser({
    quant_angle: Math.PI / 12,
    quant_radius: 1.2,
    quant_distance: 16
  });

  var zoom_rate = 1.7;

  var controls = null;
  var triangle = null;
  var slider = null;

  var zoom = null;
  var image = null;

  var spinner = new Spinner($('.spinner')[0]);
  spinner.start();

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

  function touchHandler(elt) {
    function forwardEvent(target, kind, e) {
      e.preventDefault();
      target.trigger($.Event(kind, {
        pageX: e.targetTouches[0].pageX,
        pageY: e.targetTouches[0].pageY,
        which: 1
      }));
    }

    function touchEnd(e) {
      e.preventDefault();
      $(elt).trigger('mouseup');
    }

    elt.addEventListener("touchstart", function() {
      if (controls) controls.setFlag('fat', true);
      forwardEvent($(elt), 'mousedown', event);
    },
    false);

    elt.addEventListener("touchmove", function(e) {
      forwardEvent($(elt), 'mousemove', e);
    },
    true);

    elt.addEventListener("touchend", touchEnd, false);
    document.body.addEventListener("touchcancel", touchEnd, false);
  }

  touchHandler($source[0]);

  function makeControls(zoom) {
    $source.off('.main'); // if reloading
    $('body').off('.main');
    if (controls) controls.destroy();
    controls = new Controls(src_cvs, {
      quantiser: quantiser,
      own_handlers: false
    });

    var radius = Math.min(src_cvs.width, src_cvs.height) / 5;
    triangle = new Triangle(0, 0, radius, 0, zoom);
    controls.add(triangle);

    slider = new Slider(0, -30, {
      min: -500,
      max: 500,
      width: 300
    });
    slider.setOrigin(0.5, 1);

    controls.add(slider);

    $source.on('mousedown.main', function(e) {
      if (e.which != 1) return;
      if (!zoom) return;

      if (controls.mouseDown(e)) return;

      var x = e.pageX - $(e.target).offset().left;
      var y = e.pageY - $(e.target).offset().top;

      var init_x = x;
      var init_y = y;
      var init_zoom = zoom.getState();

      $source.on('mousemove.main', function(e) {
        var x = e.pageX - $(e.target).offset().left;
        var y = e.pageY - $(e.target).offset().top;
        var nx = init_zoom.x + (x - init_x) / init_zoom.scale;
        var ny = init_zoom.y + (y - init_y) / init_zoom.scale;
        if (Modifiers.down('shift')) {
          nx = quantiser.quantiseWorldDistance(nx, init_zoom.scale);
          ny = quantiser.quantiseWorldDistance(ny, init_zoom.scale);
        }
        zoom.setOffset(nx, ny);
        controls.redraw();
      });

      $('body').on('mouseup.main', function(e) {
        $source.off('mousemove.main');
        $('body').off('mouseup.main');
      });

    });
  }

  function setImage(img) {
    image = img;
    zoom = new ZoomPan(src_cvs.width, src_cvs.height, img.width, img.height);
    makeControls(zoom);
    redraw();
  }

  function loadImage(url) {
    spinner.start();
    var $img = $('<img></img>').load(function() {
      setImage($img[0]);
      spinner.stop();
    }).attr({
      src: url
    });
  }

  function loadRandom(mani) {
    var keys = Object.keys(mani);
    var pick = Math.floor(Math.random() * keys.length);
    loadImage('art/' + mani[keys[pick]]);
  }

  function showViewer() {
    spinner.start();
    var cutting = triangle.sample(image, zoom);
    var width = 2560;
    var height = 1440;
    var img = triangle.makeImage(cutting, width, height);
    var img_data = img.toDataURL();
    $('.popup.image img').one('load', function(e) {
      $(this).parent().fadeIn();
      spinner.stop();
    }).attr({
      src: img_data
    });
  }

  function hidePopup($elt) {
    if ($elt.length) {
      $elt.fadeOut().find('img.dynamic').attr({
        src: ""
      });
    }
  }

  $(window).on('keydown', null, 'v', function(e) {
    e.stopPropagation();
    e.preventDefault();
    showViewer();
  }).on('keydown', null, 'esc', function(e) {
    e.stopPropagation();
    e.preventDefault();
    hidePopup($('.popup:visible'));
  });

  $(window).resize(function() {
    resize();
  });

  $source.on('redraw', function(e) {
    redraw();
  }).on('slide', function(e, ui) {
    if (zoom) {
      var scale = Math.pow(zoom_rate, ui.value / 100);
      zoom.setScale(scale);
    }
  });

  $destination.click(function(e) {
    if (e.which != 1) return;
    if (triangle) {
      var cutting = triangle.sample(image, zoom);
      var size = Math.max(dst_cvs.width, dst_cvs.height) * 1.5;
      setImage(triangle.makeImage(cutting, size, size));
    }
  });

  $('.popup .ctl.close').click(function(e) {
    if (e.which = 1) hidePopup($(this).closest('.popup'));
  });

  $('.ctl.viewer').click(function(e) {
    showViewer();
  });

  resize();

  $.ajax({
    url: manifest,
    dataType: 'json'
  }).done(function(mani) {
    loadRandom(mani);
    spinner.stop();
  }).fail(function() {
    console.log("Can't load " + manifest);
  });

  // Drag & drop image
  $(window).on('dragenter', function(e) {
    e.stopPropagation();
    e.preventDefault();
  });

  $(window).on('dragover', function(e) {
    e.stopPropagation();
    e.preventDefault();
  });

  $(window).on('drop', function(e) {
    e.stopPropagation();
    e.preventDefault();
    var files = e.originalEvent.dataTransfer.files;
    var imageType = /^image\//;
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      if (!imageType.test(file.type)) continue;
      var reader = new FileReader();
      reader.onload = function(e) {
        loadImage(e.target.result);
      };
      reader.readAsDataURL(file);
      break; // first image only
    }
  });

});
