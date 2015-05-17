function Slider(x, y, opts) {
  this.x = x;
  this.y = y;
  this.config = $.extend({},
  {
    width: 200,
    min: -10,
    max: 10,
    align: 'centre',
    line_colour: 'white',
    handle_colour: 'rgb(255, 128, 128)'
  },
  opts);
  this.value = 0;
}

Slider.prototype = new Control();
$.extend(Slider.prototype, {

  valToPos: function(val) {
    return (val - this.config.min) * this.config.width / (this.config.max - this.config.min);
  },

  posToVal: function(pos) {
    return pos * (this.config.max - this.config.min) / this.width + this.config.min;
  },

  alignAdjust: function() {
    switch (this.config.align) {
    case 'left':
      return 0;
    case 'centre':
      return -this.config.width / 2;
    case 'right':
      return -this.config.width;
    }
    return 0;
  },

  draw: function(ctx) {
    ctx.save();

    ctx.translate(this.alignAdjust() + this.x, this.y);

    ctx.lineWidth = 3;
    ctx.strokeStyle = this.config.line_colour;

    ctx.beginPath();
    var cx = this.valToPos(this.value);

    if (cx > this.hs) {
      ctx.moveTo(0, 0);
      ctx.lineTo(cx - this.hs, 0);
    }

    if (cx < this.config.width - this.hs) {
      ctx.moveTo(cx + this.hs, 0);
      ctx.lineTo(this.config.width, 0);
    }

    ctx.stroke();
    ctx.strokeStyle = this.config.handle_colour;
    this.controlCircle(ctx, cx, 0);

    ctx.restore();
  },

  decodeClick: function(x, y) {
    var cx = this.valToPos(this.value);

  }
});
