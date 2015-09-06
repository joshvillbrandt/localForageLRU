describe('localForageLRU', function() {
  var recencyKey = ''; // unchanged from default settings

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

  describe('setItem()', function() {
    it('should add new items to the data store and mark them as recently used', function() {

    });

    it('should automatically remove the least recently used items as necessary to make room for new items', function() {

    });

    it('should throw an error if the client tries to use the recency key', function() {

    });

    fit('should persist the recency states between browser sessions', function(done) {
      // set one item to init the recency list
      var set = localforagelru.setItem('key', 'value');

      // number of items should actually be two because of the recency list also being stored
      set.then(function(){
        localforagelru.length().then(function(numberOfKeys){
          expect(numberOfKeys).toBe(2);
          done();
        });
      });
    });
  });

  describe('getItem()', function() {
    it('should update existing items as recently used', function() {

    });
  });

  describe('removeItem()', function() {
    it('should remove the item from the recency list as well', function() {

    });
  });
});
