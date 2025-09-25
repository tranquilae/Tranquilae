// Startup polyfill - must run immediately
// This file should be loaded before any other modules that might reference 'self'

(function() {
  'use strict';
  
  // Only run in Node.js environment (server-side)
  if (typeof window === 'undefined' && typeof global !== 'undefined') {
    // Define 'self' as the global object if it doesn't exist
    if (typeof self === 'undefined') {
      global.self = global;
      
      // Also define it on globalThis for modern Node.js
      if (typeof globalThis !== 'undefined') {
        globalThis.self = global;
      }
    }
    
    // Define other common browser globals as undefined
    if (typeof window === 'undefined') {
      global.window = undefined;
    }
    if (typeof navigator === 'undefined') {
      global.navigator = undefined;
    }
    if (typeof document === 'undefined') {
      global.document = undefined;
    }
  }
})();