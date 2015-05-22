function Slider(x, y, opts) {
  this.config = $.extend({},
  {
    width: 200,
    min: -10,
    max: 10,
    align: 'centre',
    line_colour: 'white',
    handle_colour: 'rgb(255, 96, 96)'
  },
  opts);
  this.value = 0;
  this.setPosition(x, y);
}

Slider.prototype = new Control();
$.extend(Slider.prototype, {

  valToPos: function(val) {
    return (val - this.config.min) * this.config.width / (this.config.max - this.config.min);
  },

  posToVal: function(pos) {
    return pos * (this.config.max - this.config.min) / this.config.width + this.config.min;
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

    ctx.translate(this.alignAdjust(), 0);

    ctx.lineWidth = this.metrics.line_width;
    ctx.strokeStyle = this.config.line_colour;

    ctx.beginPath();
    var cx = this.valToPos(this.value);

    if (cx > this.metrics.handle_size) {
      ctx.moveTo(0, 0);
      ctx.lineTo(cx - this.metrics.handle_size, 0);
    }

    if (cx < this.config.width - this.metrics.handle_size) {
      ctx.moveTo(cx + this.metrics.handle_size, 0);
      ctx.lineTo(this.config.width, 0);
    }

    ctx.stroke();
    ctx.strokeStyle = this.config.handle_colour;
    this.controlCircle(ctx, cx, 0);

    ctx.restore();
  },

  mouseDown: function(x, y) {
    x -= this.alignAdjust();
    var cx = this.valToPos(this.value);
    if (this.inControlCircle(cx, 0, x, y)) {
      this.dragThis(cx + this.alignAdjust(), 0, null);
    }
  },

  mouseMove: function(x, y, data) {
    x -= this.alignAdjust();
    if (Modifiers.down('shift')) x = this.getQuantiser().quantiseDistance(x);
    var nval = Math.max(this.config.min, Math.min(this.posToVal(x), this.config.max));
    this.value = nval;
    this.trigger('slide', {
      value: this.value
    });
  }

});
