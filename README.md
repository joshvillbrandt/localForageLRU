[![Build Status](https://travis-ci.org/joshvillbrandt/localForageLRU.svg?branch=master)](https://travis-ci.org/joshvillbrandt/localForageLRU)

# localForageLRU

A wrapper around `localForage` that provides an LRU cache behavior.

## Background

This library seeks to provide a local storage interface for web browsers that can tolerate very large database sizes. A least recently used (LRU) policy is implemented on top of [localForage](https://github.com/mozilla/localForage). The API for `localForageLRU` is exactly the same as it is for `localForage` - the only difference is that old objects are removed as necessary to put in new objects.

## Setup

Install with bower:

```bash
bower install localforagelru --save
```

## Usage

Good news, everyone! The API for `localForageLRU` is exactly the same as it is for `localForage`. Both the callback and promise methods are supported. Check out the [localForage README](https://github.com/mozilla/localForage) and [localForage API docs](http://mozilla.github.io/localForage/) for detailed API information.

Here is an example usage using the promise methods:

```javascript
// A full setItem() call with Promises.
localforage.setItem('key', 'value').then(function(value) {
    alert(value + ' was set!');
}, function(error) {
    console.error(error);
});
```

## Development

This library has been developed with node 0.10. If you don't have node, first install it with [nvm](https://github.com/creationix/nvm).

Here is how to checkout the code, install the dependencies, and run the tests:

```bash
git checkout https://github.com/joshvillbrandt/localForageLRU.git
cd localForageLRU
npm install
npm test
```

## Change Log

This project uses [semantic versioning](http://semver.org/).

### 1.0.0 - 2015/09/07

* Initial release.
