module.exports = (function() {
  "use strict";

  var spawn = require('child_process')
    .spawn;

  return function(outfile) {
    var args = ['-f', 'mjpeg', '-i', '-', '-an', '-pix_fmt', 'yuv420p',
      '-r:v', '25', '-c:v', 'libx264', '-b:v', '16000k', '-y', outfile
    ];
    var ffmpeg = spawn('ffmpeg', args);
    return ffmpeg.stdin;
  }

})();
