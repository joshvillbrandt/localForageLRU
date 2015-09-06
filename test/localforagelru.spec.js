describe('localForageLRU', function() {
  var recencyKey = ''; // unchanged from default settings

  // helper to evaluate number of items in the data store
  var expectStoreLength = function(store, expectedLength) {
    return function() {
      var promise = store.length();

      promise.then(function(length){
        expect(length).toBe(expectedLength);
      }, function() {
        expect('store.length()').toBe('successful');
      });

      return promise;
    };
  };

  // helper to evaluate the order of the recency list
  var expectRecencyOrder = function(store, expectedOrder) {
    return function() {
      var promise = store._getRecency();

      promise.then(function(recency) {
        expect(recency).toEqual(expectedOrder);
      }, function() {
        expect('store._getRecency()').toBe('successful');
      });

      return promise;
    };
  };

  beforeEach(function(){
    localforagelru.clear();
  });

  it('should export a localforagelru object', function() {
    expect(localforagelru).toBeDefined();
  });

  it('should provide the same API as localForage', function() {
    var methods = ['_config', 'clear', 'getItem', 'iterate', 'key', 'keys', 'length', 'removeItem', 'setItem'];

    methods.forEach(function(method){
      expect(localforagelru[method]).toBeDefined();
    });
  });

  describe('createInstance()', function() {
    it('should return an instance of LocalForageLRU', function() {
      // this is kind of a hacky way to test this - suggestions?
      var store = localforagelru.createInstance();
      expect(store._config.recencyKey).toBeDefined();
    });

    it('should allow the normal localForage configuration options', function() {
      var store = localforagelru.createInstance({storeName: 'test'});
      expect(store._config.storeName).toBe('test');
    });

    it('should allow multiple instances to be created', function(done) {
      // create stores
      var store = localforagelru.createInstance({name: 'nameHere'});
      var otherStore = localforagelru.createInstance({name: 'otherName'});

      // make sure these stores are clear from previous tests
      store.clear();
      otherStore.clear();

      // set the same key on both
      var key = 'key';
      var storeSet = store.setItem(key, 'one');
      var otherStoreSet = otherStore.setItem(key, 'two');

      // make sure the values at the same key are different between the stores
      Q.all([storeSet, otherStoreSet]).then(function(){
        var storeValue = '', otherStoreValue = '';
        var storeGet = store.getItem(key);
        var otherStoreGet = otherStore.getItem(key);

        Q.all([storeGet, otherStoreGet]).then(function(){
          expect(storeValue === otherStoreSet).toBeFalsy();
          done();
        });
      });
    });
  });

  describe('setItem()', function(done) {
    it('should persist the recency states between browser sessions', function(done) {
      // approach:
      //  - set one item
      //  - make sure two items are in the store (added items + recency list)

      localforagelru.setItem('key', 'value')
      .then(expectStoreLength(localforagelru, 2))
      .then(done, done);
    });

    it('should add new items to the data store and mark them as recently used', function(done) {
      // approach:
      //  - set two items
      //  - make sure three items are in the store (added items + recency list)
      //  - make sure the order of the recency list is correct

      localforagelru.setItem('a', 'value')
      .then(function() { return localforagelru.setItem('b', 'value'); })
      .then(expectStoreLength(localforagelru, 3))
      .then(expectRecencyOrder(localforagelru, ['a', 'b']))
      .then(done, done);
    });

    it('should update existing items in recency list', function(done) {
      // approach:
      //  - set two items
      //  - make sure the order of the recency list is correct
      //  - set the first item again
      //  - make sure the order of the recency list has changed

      localforagelru.setItem('a', 'value')
      .then(function() { return localforagelru.setItem('b', 'value'); })
      .then(expectRecencyOrder(localforagelru, ['a', 'b']))
      .then(function() { return localforagelru.setItem('a', 'value'); })
      .then(expectRecencyOrder(localforagelru, ['b', 'a']))
      .then(done, done);
    });

    xit('should automatically remove the least recently used items as necessary to make room for new items', function() {

    });

    it('should error if the client tries to use the recency key', function(done) {
      // approach:
      //  - set one item
      //  - throw an error if we enter the success callback

      localforagelru.setItem(recencyKey, 'value')
      .then(function(){
        expect('promise').toBe('rejected');
        done();
      }, done);
    });
  });

  describe('getItem()', function() {
    it('should update existing items in recency list', function(done) {
      // approach:
      //  - set two items
      //  - make sure the order of the recency list is correct
      //  - access the second item
      //  - make sure the order of the recency list is unchanged
      //  - access the first item
      //  - make sure the order of the recency list has changed

      localforagelru.setItem('a', 'value')
      .then(function() { return localforagelru.setItem('b', 'value'); })
      .then(expectRecencyOrder(localforagelru, ['a', 'b']))
      .then(function() { return localforagelru.getItem('b'); })
      .then(expectRecencyOrder(localforagelru, ['a', 'b']))
      .then(function() { return localforagelru.getItem('a'); })
      .then(expectRecencyOrder(localforagelru, ['b', 'a']))
      .then(done, done);
    });
  });

  describe('removeItem()', function() {
    it('should remove the item from the recency list as well', function(done) {
      // approach:
      //  - set two items
      //  - make sure the order of the recency list is correct
      //  - remove the first item
      //  - make sure the order of the recency list has changed

      localforagelru.setItem('a', 'value')
      .then(function() { return localforagelru.setItem('b', 'value'); })
      .then(expectRecencyOrder(localforagelru, ['a', 'b']))
      .then(function() { return localforagelru.removeItem('a'); })
      .then(expectRecencyOrder(localforagelru, ['b']))
      .then(done, done);
    });
  });
});
