var MathX = {
  fmod: function(x, y) {
    if (y == 0.0) return NaN;
    var i = Math.floor(x / y);
    var f = x - i * y;
    if ((x < 0.0) != (y < 0.0)) f = f - y;
    return f;
  },

  fmodp: function(x, y) {
    if (y == 0.0) return NaN;
    if (y < 0) return MathX.fmodp(-x, -y);
    if (x < 0) x += y * Math.floor(-x / y + 1);
    return MathX.fmod(x, y);
  }
};
