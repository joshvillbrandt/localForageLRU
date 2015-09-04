# localForageLRU

A wrapper around `localForage` that provides an LRU cache behavior.

## Background

This library seeks to provide a local storage interface for web browsers that can tolerate very large database sizes. A least recently used policy is implemented on top of [localForage](https://github.com/mozilla/localForage). The API for `localForageLRU` is exactly the same as it is for `localForage` - the only difference is that old objects are removed as necessary to put in new objects.

## Setup

Install with bower:

```bash
bower install localforage-lru --save
```

## Usage

```javascript
// tbd
```

## Development

This repo is testing with node 0.10. If you don't have node, first install it with [nvm](https://github.com/creationix/nvm).

Here is how to checkout the code, install the dependencies, and run the tests:

```bash
git checkout https://github.com/joshvillbrandt/localForageLRU.git
cd localForageLRU
npm install
npm test
```

## Change Log

This project uses [semantic versioning](http://semver.org/).

### 1.0.0 - 2015/09/04

* Initial release.
