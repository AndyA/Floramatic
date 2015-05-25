"use strict";

var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var fs = require('fs');

var WEBROOT = 'www';

var args = process.argv.slice(2);

var artroot = WEBROOT + '/art';
if (args.length) artroot = args[0];

app.use(bodyParser.json())

app.use(function(err, req, res, next) {
  var msg = err.msg || '500 - Internal Server Error';
  res.send(500, {
    error: msg
  });
});

function findDirs(objs, done) {
  var dirs = [];

  function checkObj() {
    if (!objs) return;
    if (!objs.length) {
      done(null, dirs);
      return;
    }

    var obj = objs.shift();
    fs.stat(obj, function(err, st) {
      if (err) {
        done(err, []);
      }
      else {
        if (st.isDirectory()) {
          dirs.push(obj);
        }
        checkObj();
      }
    });
  }

  checkObj();
}

function find(dir, like, done) {
  var queue = [dir];
  var found = [];

  function scan() {
    if (!queue) return;
    if (!queue.length) {
      done(null, found);
      return;
    }

    var d = queue.shift();

    fs.readdir(d, function(err, files) {
      if (err) {
        done(err, null);
        return;
      }

      var subs = [];
      for (var i = 0; i < files.length; i++) {
        (like.test(files[i]) ? found : subs).push(d + '/' + files[i]);
      }

      findDirs(subs, function(err, dirs) {
        if (err) {
          done(err, null);
          queue = null;
        }
        else {
          Array.prototype.push.apply(queue, dirs);
        }
        scan();
      });

    });

  }

  scan();
}

var manifest = null;

app.get('/art/manifest.json', function(req, res, next) {
  if (manifest) {
    res.send(manifest);
    return
  }

  find(artroot, /\.(?:png|jpeg|jpg)$/i, function(err, files) {
    if (err) {
      next(err);
      return;
    }

    manifest = {};
    console.log("Found " + files.length + " images at " + artroot);
    for (var i = 0; i < files.length; i++) {
      var id = 'img' + i;
      manifest[id] = '/art' + files[i].substr(artroot.length);
    }
    res.send(manifest);
  });

});

app.post('/rconsole/send', function(req, res) {
  var lines = req.body;
  for (var i = 0; i < lines.length; i++) {
    console[lines[i].m].apply(console, lines[i].a);
  }
  res.send({
    status: 'OK'
  });
});

app.use('/art', express.static(artroot));
app.use(express.static(WEBROOT));

app.listen(3000);
