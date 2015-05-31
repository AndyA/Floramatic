var $ = require('jquery');

$(function() {
  "use strict";

  var Promise = require('bluebird');
  var Controls = require('./controls.js');
  var Spinner = require('./spinner.js');
  var ZoomPan = require('./zoompan.js');
  var Triangle = require('./triangle.js');
  var Slider = require('./slider.js');
  var Quantiser = require('./quantiser.js');
  var Modifiers = require('./modifiers.js');
  var FloraCutter = require('./floracutter.js');
  var UISender = require('./ui-sender/client.js');

  var config = '/config.json';
  var manifest = '/art/manifest.json';

  var $source = $('#source');
  var src_cvs = $source[0];
  var src_ctx = src_cvs.getContext('2d');

  var $destination = $('#destination');
  var dst_cvs = $destination[0];
  var dst_ctx = dst_cvs.getContext('2d');

  var cutter = new FloraCutter();

  var quantiser = new Quantiser({
    angle: Math.PI / 12,
    radius: 1.2,
    distance: 16
  });

  var zoom_rate = 1.7;

  var controls = null;
  var triangle = null;
  var slider = null;
  var appConfig = {};
  var sender = null;

  var zoom = null;

  var spinner = new Spinner($('.spinner')[0]);

  function bootstrap() {
    var todo = [];
    spinner.start();

    Promise.join(Promise.resolve($.ajax({
      url: config,
      dataType: 'json'
    })), Promise.resolve($.ajax({
      url: manifest,
      dataType: 'json'
    })), function(cfg, mani) {
      if (cfg.ui) sender = new UISender(cfg.ui.endpoint);
      loadRandom(mani);
    }).caught(function(xhr) {
      // TODO some kind of user feedback maybe?
      console.log("Can't load resource:", xhr);
    }).lastly(function() {
      spinner.stop();
    });

  }

  function sendEvent(ev) {
    if (sender) sender.sendEvent(ev);
  }

  function drawSource(ctx) {
    zoom.draw(ctx);
  }

  function redraw() {
    if (!controls) return;

    src_ctx.clearRect(0, 0, src_cvs.width, src_cvs.height);
    dst_ctx.clearRect(0, 0, dst_cvs.width, dst_cvs.height);

    src_ctx.save();
    src_ctx.translate(src_cvs.width / 2, src_cvs.height / 2);
    drawSource(src_ctx);
    src_ctx.restore();

    controls.draw(src_ctx);

    cutter.drawTile(dst_ctx, 0, 0, dst_cvs.width, dst_cvs.height, triangle, drawSource);
    sendEvent({
      triangle: triangle.getState(),
      zoom: zoom.getState()
    });
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

  function makeControls(img) {
    $source.off('.main'); // if reloading
    $('body').off('.main');
    if (controls) controls.destroy();

    zoom = new ZoomPan(img);
    quantiser.setScale(1);

    controls = new Controls(src_cvs, {
      quantiser: quantiser,
      own_handlers: false
    });

    var radius = Math.min(src_cvs.width, src_cvs.height) / 5;
    triangle = new Triangle(0, 0, radius, 0);
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
        if (Modifiers.down('alt')) {
          var st = zoom.getState();
          triangle.translatePosition((nx - st.x) * st.scale, (ny - st.y) * st.scale);
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
    makeControls(img);
    redraw();
  }

  function loadImage(url) {
    spinner.start();
    var $img = $('<img></img>').load(function() {
      sendEvent({
        image: $img[0].src
      });
      setImage($img[0]);
      spinner.stop();
    }).attr({
      src: url
    });
  }

  function loadRandom(mani) {
    var keys = Object.keys(mani);
    var pick = Math.floor(Math.random() * keys.length);
    loadImage(mani[keys[pick]]);
  }

  function showViewer() {
    spinner.start();
    var width = 2560;
    var height = 1440;
    var img = cutter.makeImage(triangle, drawSource, width, height);
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

  $(window).on('keydown', function(e) {
    switch (e.which) {
    case 86:
      e.stopPropagation();
      e.preventDefault();
      showViewer();
      break;
    case 27:
      e.stopPropagation();
      e.preventDefault();
      hidePopup($('.popup:visible'));
      break;
    }
  });

  $(window).resize(function() {
    resize();
  });

  $source.on('redraw', function(e) {
    redraw();
  }).on('slide', function(e, ui) {
    if (zoom) {
      var scale = Math.pow(zoom_rate, ui.value / 100);
      if (Modifiers.down('alt')) {
        var st = zoom.getState();
        var tp = triangle.getPosition();
        var nx = st.x - tp.x / st.scale + tp.x / scale;
        var ny = st.y - tp.y / st.scale + tp.y / scale;
        zoom.setOffset(nx, ny);
        triangle.setRadius(triangle.getRadius() / st.scale * scale);
      }
      zoom.setScale(scale);
      quantiser.setScale(scale);
    }
  });

  $destination.click(function(e) {
    if (e.which != 1) return;
    if (triangle) {
      var size = Math.max(dst_cvs.width, dst_cvs.height) * 1.5;
      sendEvent({
        image: {
          src: 'right',
          width: size,
          height: size
        }
      });
      setImage(cutter.makeImage(triangle, drawSource, size, size));
    }
  });

  $('.popup .ctl.close').click(function(e) {
    if (e.which = 1) hidePopup($(this).closest('.popup'));
  });

  $('.ctl.viewer').click(function(e) {
    showViewer();
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

  bootstrap();
  resize();

});
