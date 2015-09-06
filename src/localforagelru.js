(function(window, localforage) {
  'use strict';

  // callback helper
  function executeCallback(promise, callback) {
    if(callback) {
      promise.then(function(result) {
        callback(null, result);
      }, function(error) {
        callback(error);
      });
    }
  }

  // extend helper
  function extend(a, b) {
    Object.keys(b).forEach(function(key) {
      a[key] = b[key];
    });
  }

  // factory
  var createLocalForageLRU = function(options) {
    // define constructor
    var LocalForageLRU = function() {};

    // set some default options
    options = options || {};
    options.recencyKey = options.recencyKey || '';
    options.debugLRU = options.debugLRU || true;

    // create LocalForage instance with particular options to prototype from
    LocalForageLRU.prototype = localforage.createInstance(options);

    // an implementation of setItem to removes items when the quota is reached
    LocalForageLRU._shoveItem = function(key, value) {
      // var promise = new Promise(function(resolve, reject) {

      // });

      // return promise;
      // console.log(Object.keys(this))
      return Object.getPrototypeOf(this).setItem.call(this, key, value);
    };

    LocalForageLRU._getRecency = function() {
      var self = this;

      var promise = new Promise(function(resolve, reject) {
        // resolve immediately if recency list is in memory
        if(self._recency !== undefined) {
          resolve(self._recency);
        }

        // recency list is not in memory, let's grab it
        else {
          self.getItem(self._config.recencyKey).then(function(_recency) {
            // init recency list if needed
            if(_recency === null) {
              _recency = [];

              if(self._config.debugLRU) {
                console.info('recency list initialized for "' + self._config.storeName + '"');
              }
            }

            // store the result locally
            self._recency = _recency;

            // resolve
            resolve(self._recency);
          }, reject);
        }
      });

      return promise;
    };

    // update the recency of a specific key
    LocalForageLRU._updateRecency = function(key, remove) {
      remove = remove || false;

      var self = this;

      var promise = new Promise(function(resolve, reject) {
        // get list
        self._getRecency().then(function() {
          // remove the key if it already exists

          // add key to the end of the LRU list
          if(!remove) {
            self._recency.push(key);
          }

          // save the recency list for future sessions
          self._shoveItem(self._config.recencyKey, self._recency).then(resolve, reject);
        }, reject);
      });

      return promise;
    };

    // override setItem() function
    LocalForageLRU.setItem = function(key, value, callback) {
      var self = this;

      var promise = new Promise(function(resolve, reject) {
        // set the item itself first
        var itemPromise = self._shoveItem(key, value);

        // then update the recency list
        itemPromise.then(function() {
          var recencyPromise = self._updateRecency(key);

          // then we are done!
          recencyPromise.then(function() {
            // return the initial value like localForage does
            resolve(value);
          }, reject);
        }, reject);
      });

      executeCallback(promise, callback);
      return promise;
    };

    // override prototype.createInstance() function
    LocalForageLRU.createInstance = function(options) {
      return createLocalForageLRU(options);
    };

    // create new instance and extend it with instance methods
    var localforagelru = new LocalForageLRU();
    extend(localforagelru, LocalForageLRU);

    // return new instance
    return localforagelru;
  };

  // export module
  // TODO: use grown-up module pattern instead of this global
  window.localforagelru = createLocalForageLRU();

})(window, localforage);
