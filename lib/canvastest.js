$(function() {
  "use strict";

  function redrawCanvas(cvs) {
    var ctx = cvs.getContext('2d');

    ctx.save();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(cvs.width, cvs.height);
    ctx.moveTo(cvs.width, 0);
    ctx.lineTo(0, cvs.height);
    ctx.stroke();
    ctx.restore();
  }

  function redraw() {
    $('.canvas-wrapper canvas').each(function() {
      redrawCanvas(this);
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
      redrawCanvas($canvas[0]);
    });
  }

  resize();

  $(window).resize(function() {
    resize();
  });

});
