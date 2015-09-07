(function(window, localforage) {
  'use strict';

  // TODO: Without a transaction scheme, the recency list is subject to another
  // browser overwriting changes without previously have a recent copy. This will
  // lead to data leaks eventually (item in the store by not in the recency list.)

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
    options.debugLRU = options.debugLRU || false;

    // create LocalForage instance with particular options to prototype from
    LocalForageLRU.prototype = localforage.createInstance(options);

    // log function that respects options.debugLRU
    LocalForageLRU._debugLRU = function() {
      if(this._config.debugLRU) {
        console.info.apply(null, arguments);
      }
    };

    // try to remove the least recently used item
    LocalForageLRU._shiftItem = function() {
      var self = this;

      var promise = new Promise(function(resolve, reject) {
        self._getRecency().then(function(_recency) {
          // cannot remove item if there are none
          if(_recency.length < 1) {
            reject();
          }

          // attempt to remove the first item in the recency list
          self.removeItem(_recency[0]).then(function() {
            self._debugLRU('LRU "' + self._config.storeName + '" over quota; item removed');

            resolve();
          }, reject);
        }, reject);
      });

      return promise;
    };

    // an implementation of setItem to removes items when the quota is reached
    LocalForageLRU._shoveItem = function(key, value) {
      var self = this;

      var promise = new Promise(function(resolve, reject) {
        // this is the recursive function
        var setItemOrRemoveAndTryAgain = function() {
          // use actual setItem class
          Object.getPrototypeOf(self)
          .setItem.call(self, key, value)
          .then(resolve, function(reason) {
            // setItem failed! let's try to remove the LRU item
            // stop trying if this command fails (store is probably empty)
            self._shiftItem().then(function() {
              // continue loop; try setItem again!
              setItemOrRemoveAndTryAgain();
            }, reject);
          });
        };

        // start the loop
        setItemOrRemoveAndTryAgain();
      });

      return promise;
    };

    LocalForageLRU._getRecency = function() {
      var self = this;

      var promise = new Promise(function(resolve, reject) {
        // directly use the localForage getItem to avoid updating the recency list
        Object.getPrototypeOf(self).getItem.call(self, self._config.recencyKey)
        .then(function(_recency) {
          // init recency list if needed
          if(_recency === null) {
            _recency = [];

            self._debugLRU('LRU "' + self._config.storeName + '" initialized');
          }

          // resolve
          resolve(_recency);
        }, reject);
      });

      return promise;
    };

    // update the recency of a specific key
    LocalForageLRU._updateRecency = function(key, remove) {
      remove = remove || false;

      var self = this;

      var promise = new Promise(function(resolve, reject) {
        // get list
        self._getRecency().then(function(_recency) {
          // remove the key if it already exists
          var index = _recency.indexOf(key);
          if(index !== -1) {
            _recency.splice(index, 1);
          }

          // add key to the end of the LRU list
          if(!remove) {
            _recency.push(key);
          }

          // save the recency list for future sessions
          // TODO: debounce this write for performance
          self._shoveItem(self._config.recencyKey, _recency).then(resolve, reject);
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

  // create stress test function
  var stressTest = function(store, sizeInMegs, prefix) {
    prefix = prefix || '';

    // create "one meg" from 1e6 bytes
    var oneMeg = '';
    for(var j = 0; j < 1000000; j++) {
      oneMeg = oneMeg += '1234567890';
    }

    var i = 0;

    var set = function(){
      var key = prefix + String(i);
      store.setItem(key, oneMeg).then(function(){
        console.log('setItem done');

        i = i + 1;
        if(i < sizeInMegs) {
          set();
        }
      }, function(err) {
        console.log('setItem error', err);
      });
    };

    set();
  };

  // export stress test
  window.localforageStressTester = stressTest;

})(window, localforage);
