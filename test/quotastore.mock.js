// helper function for method responses
var tenCharQuotaStoreResponse = function(callback, success, value) {
  return new Promise(function(resolve, reject) {
    if(success) {
      resolve(value);
      callback(null, value);
    }
    else {
      reject();
      callback('error');
    }
  });
};

// a special driver that throws quota errors when the total string length of all values is greater than 10 characters
var tenCharQuotaStore = {
  _driver: 'tenCharQuotaStore',
  _initStorage: function(options) {
    this.store = {};
  },
  _underQuota: function(tryingToAdd) {
    var maxLength = 10;
    tryingToAdd = tryingToAdd || '';

    // store length is evaluated as the string length of all items in the store
    var length = 0;
    Object.keys(this.store).forEach(function(key) {
      var value = this.store[key];

      if(!Array.isArray(value)) {
        length = length + value.length;
      }
    }, this);

    // also include length of item we are trying to store
    if(!Array.isArray(tryingToAdd)) {
      length = length + tryingToAdd.length;
      console.log('QUOTA SIZE', length, 'tryingToAdd', tryingToAdd, length <= maxLength);
    }

    return (length <= maxLength);
  },
  clear: function(callback) {
    this._initStorage();

    return tenCharQuotaStoreResponse(callback, true);
  },
  getItem: function(key, callback) {
    var value = (this.store[key] !== undefined) ? this.store[key] : null;

    return tenCharQuotaStoreResponse(callback, true, value);
  },
  key: function(n, callback) {
    var key = 'not implemented';

    return tenCharQuotaStoreResponse(callback, true, key);
  },
  keys: function(callback) {
    var keys = Object.keys(this.store);

    return tenCharQuotaStoreResponse(callback, true, keys);
  },
  length: function(callback) {
    var length = Object.keys(this.store).length;

    return tenCharQuotaStoreResponse(callback, true, length);
  },
  removeItem: function(key, callback) {
    delete this.store[key];

    return tenCharQuotaStoreResponse(callback, true);
  },
  setItem: function(key, value, callback) {
    // store item if we are under quota
    var success = this._underQuota(value);
    if(success) {
      this.store[key] = value;
    }

    return tenCharQuotaStoreResponse(callback, success, value);
  },
  iterate: function(iteratorCallback, successCallback) {},
};

// add the driver to localForage
var tenCharQuotaStorePromise = localforagelru.defineDriver(tenCharQuotaStore);
