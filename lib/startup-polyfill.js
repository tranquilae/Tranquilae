// Startup polyfill - must run immediately
// This file should be loaded before any other modules that might reference 'self'

(function() {
  'use strict';
  
  // Comprehensive polyfill for server-side environment
  if (typeof globalThis !== 'undefined') {
    // Modern approach using globalThis
    if (typeof globalThis.self === 'undefined') {
      Object.defineProperty(globalThis, 'self', {
        value: globalThis,
        writable: false,
        enumerable: false,
        configurable: false
      });
    }
    
    // Set other browser globals
    ['window', 'navigator', 'document', 'location', 'localStorage', 'sessionStorage'].forEach(function(prop) {
      if (typeof globalThis[prop] === 'undefined') {
        Object.defineProperty(globalThis, prop, {
          value: undefined,
          writable: true,
          enumerable: false,
          configurable: true
        });
      }
    });
  }
  
  // Fallback for older Node.js versions or if globalThis approach fails
  if (typeof global !== 'undefined') {
    if (typeof global.self === 'undefined') {
      Object.defineProperty(global, 'self', {
        value: global,
        writable: false,
        enumerable: false,
        configurable: false
      });
    }
    
    // Set other browser globals
    ['window', 'navigator', 'document', 'location', 'localStorage', 'sessionStorage'].forEach(function(prop) {
      if (typeof global[prop] === 'undefined') {
        Object.defineProperty(global, prop, {
          value: undefined,
          writable: true,
          enumerable: false,
          configurable: true
        });
      }
    });
  }
  
  // Emergency fallback - try to define self globally
  try {
    if (typeof self === 'undefined') {
      // This will throw an error if self is not defined, but that's what we're trying to fix
      var g = (function() { return this; })() || (0, eval)('this');
      if (g && typeof g.self === 'undefined') {
        g.self = g;
      }
    }
  } catch (e) {
    // If all else fails, ignore the error
    console.warn('Could not define self global:', e.message);
  }
})();

// Also run the polyfill immediately when this module is loaded
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {};
}
