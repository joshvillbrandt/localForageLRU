(function(window, localforage) {
  'use strict';

  // factory
  var createLocalForageLRU = function(options) {
    var localforagelru = function() {};

    // mix in localforage functions
    Object.keys(localforage).forEach(function(key){
      localforagelru[key] = localforage[key];
    });
    localforagelru.prototype = localforage.prototype;

    // override setItem() function

    // override prototype.createInstance() function

    // return new instance
    return localforagelru;
  };

  // export module
  // TODO: use grown-up module pattern instead of this global
  window.localforagelru = createLocalForageLRU();

})(window, localforage);
