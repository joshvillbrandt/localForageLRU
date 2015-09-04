describe('localForageLRU', function() {
  it('should export an localForageLRU object', function() {
    expect(localforagelru).not.toBe(undefined);
  });

  it('should provide the same API as localForage', function() {
    var methods = ['_config', '_driverSet', '_ready', '_dbInfo', 'clear', 'getItem', 'iterate', 'key', 'keys', 'length', 'removeItem', 'setItem'];

    methods.forEach(function(method){
      expect(localforagelru.hasOwnProperty(method)).toBe(true);
    });
  });
});
