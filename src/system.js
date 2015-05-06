/*
*********************************************************************************************

  System Loader Implementation

    - Implemented to https://github.com/jorendorff/js-loaders/blob/master/browser-loader.js

    - <script type="module"> supported

*********************************************************************************************
*/

var System;

function SystemLoader(options) {
  Loader.call(this, options || {});

  var baseURL;
  // Set default baseURL and paths
  if (typeof document != 'undefined' && document.getElementsByTagName) {
    baseURL = document.baseURI;

    if (!baseURL) {
      var bases = document.getElementsByTagName('base');
      baseURL = bases[0] && bases[0].href || window.location.href;
    }

    // sanitize out the hash and querystring
    baseURL = baseURL.split('#')[0].split('?')[0];
    baseURL = baseURL.substr(0, baseURL.lastIndexOf('/') + 1);
  }
  else if (typeof process != 'undefined' && process.cwd) {
    baseURL = 'file://' + (isWindows ? '/' : '') + process.cwd() + '/';
    if (isWindows)
      baseURL = baseURL.replace(/\\/g, '/');
  }
  else if (typeof location != 'undefined') {
    baseURL = __global.location.href;
  }
  else {
    throw new TypeError('No environment baseURL');
  }

  this.baseURL = baseURL;
  this.paths = {};
}

// NB no specification provided for System.paths, used ideas discussed in https://github.com/jorendorff/js-loaders/issues/25
function applyPaths(loader, name) {
  // most specific (most number of slashes in path) match wins
  var pathMatch = '', wildcard, maxSlashCount = 0;

  // check to see if we have a paths entry
  for (var p in loader.paths) {
    var pathParts = p.split('*');
    if (pathParts.length > 2)
      throw new TypeError('Only one wildcard in a path is permitted');

    // exact path match
    if (pathParts.length == 1) {
      if (name == p) {
        pathMatch = p;
        break;
      }
    }
    // wildcard path match
    else {
      var slashCount = p.split('/').length;
      if (slashCount >= maxSlashCount &&
          name.substr(0, pathParts[0].length) == pathParts[0] &&
          name.substr(name.length - pathParts[1].length) == pathParts[1]) {
            maxSlashCount = slashCount;
            pathMatch = p;
            wildcard = name.substr(pathParts[0].length, name.length - pathParts[1].length - pathParts[0].length);
          }
    }
  }

  var outPath = loader.paths[pathMatch] || name;
  if (wildcard)
    outPath = outPath.replace('*', wildcard);

  return outPath;
}

// inline Object.create-style class extension
function LoaderProto() {}
LoaderProto.prototype = Loader.prototype;
SystemLoader.prototype = new LoaderProto();
