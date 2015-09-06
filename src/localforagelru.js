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

    // log function that respects options.debugLRU
    LocalForageLRU._debugLRU = function() {
      if(this._config.debugLRU) {
        console.info.apply(null, arguments);
      }
    };

    // an implementation of setItem to removes items when the quota is reached
    LocalForageLRU._shoveItem = function(key, value) {
      // var promise = new Promise(function(resolve, reject) {

      // });

      // return promise;
      // console.log(Object.keys(this))
      console.log('shoveItem()', key, value)
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
          // directly use the localForage getItem to avoid updating the recency list
          Object.getPrototypeOf(self).getItem.call(self, self._config.recencyKey)
          .then(function(_recency) {
            // init recency list if needed
            if(_recency === null) {
              _recency = [];

              self._debugLRU('LRU "' + self._config.storeName + '" initialized');
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
          var index = self._recency.indexOf(key);
          if(index !== -1) {
            console.warn('TRYING TO SPLICE', self._recency, 'for', key, index)
            self._recency.splice(index, 1);
          }

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

    // override getItem() function
    LocalForageLRU.getItem = function(key, callback) {
      var self = this;

      var promise = new Promise(function(resolve, reject) {
        // call the localForage getItem
        Object.getPrototypeOf(self).getItem.call(self, key)

        // then update the recency list
        .then(function(value) {
          self._updateRecency(key)
          .then(function() {
            // return the initial value like localForage does
            resolve(value);
          }, function(reason) { reject(reason); });
        }, function(reason) { reject(reason); });
      });

      executeCallback(promise, callback);
      return promise;
    };

    // override setItem() function
    LocalForageLRU.setItem = function(key, value, callback) {
      var self = this;

      var promise = new Promise(function(resolve, reject) {
        // do not let the client accidentally modify the recency list
        if(key === self._config.recencyKey) {
          reject('Cannot use the same key as the recency list');
        }
        else {
          // set the item itself first
          self._shoveItem(key, value)

          // then update the recency list
          .then(function() {
            self._updateRecency(key).then(function() {
              // return the initial value like localForage does
              resolve(value);
            }, function(reason) { reject(reason); });
          }, function(reason) { reject(reason); });
        }
      });

      executeCallback(promise, callback);
      return promise;
    };

    // override removeItem() function
    LocalForageLRU.removeItem = function(key, callback) {
      var self = this;

      var promise = new Promise(function(resolve, reject) {
        // call the localForage removeItem
        Object.getPrototypeOf(self).removeItem.call(self, key)

        // then update the recency list
        .then(function(value) {
          self._updateRecency(key, true)
          .then(function() {
            // return the initial value like localForage does
            resolve(value);
          }, function(reason) { reject(reason); });
        }, function(reason) { reject(reason); });
      });

      executeCallback(promise, callback);
      return promise;
    };

    // override prototype.clear() function
    LocalForageLRU.clear = function(options) {
      // make sure we clear the in-memory recency list
      delete this._recency;

      // then let localForage clear the actual store
      return Object.getPrototypeOf(this).clear.call(this);
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
