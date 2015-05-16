function CanvasKeeper() {
  this.cache = {};
  this.base = 1.2;
  this.log_b = Math.log(this.base);
}

$.extend(CanvasKeeper.prototype, {

  seriesSnap: function(x) {
    return Math.floor(Math.pow(this.base, Math.floor(Math.log(x) / this.log_b) + 1))
  },

  hashSlot: function(w, h) {
    var key = w + ':' + h;
    if (!this.cache.hasOwnProperty(key)) this.cache[key] = [];
    return this.cache[key];
  },

  releaseCanvas: function(cvs) {
    this.hashSlot(cvs.width, cvs.height).push(cvs);
  },

  getCanvas: function(w, h) {
    var sw = this.seriesSnap(w);
    var sh = this.seriesSnap(h);

    var slot = this.hashSlot(sw, sh);
    if (slot.length) {
      var cvs = slot.pop();
      var ctx = cvs.getContext('2d');
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      return cvs;
    }

    //    console.log("Creating a " + sw + " x " + sh + " canvas");
    var canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;

    return canvas
  }

});
