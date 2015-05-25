var $ = require('./jquery-2.1.4.min.js');

module.exports = (function() {
  "use strict";

  var modifiers = {};

  function keyToModifier(code) {
    switch (code) {
    case 16:
      return['shift'];
    case 17:
      return['ctrl'];
    case 18:
      return['alt'];
    case 91:
      return['left-cmd', 'cmd'];
    case 93:
      return['right-cmd', 'cmd'];
    case 37:
      return['left'];
    case 38:
      return['up'];
    case 39:
      return['right'];
    case 40:
      return['down'];
    }
    return[];
  }

  function setModifiers(list, state) {
    for (var i = 0; i < list.length; i++) modifiers[list[i]] = state;
  }

  $(function() {
    $(window).on('keydown', function(e) {
      setModifiers(keyToModifier(e.which), true);
      return true;
    }).on('keyup', function(e) {
      setModifiers(keyToModifier(e.which), false);
      return true;
    });
  });

  return {
    down: function(mods) {
      var modlist = mods.split(/\s+/);
      for (var i = 0; i < modlist.length; i++) {
        if (!modifiers[modlist[i]]) return false;
      }
      return true;
    }
  };

})();
