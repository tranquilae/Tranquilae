// Node.js require polyfill for browser globals
// This file is loaded automatically by Node.js

// Minimal polyfill for 'self' global that only provides what's needed for Sentry
if (typeof window === 'undefined' && typeof self === 'undefined') {
  // Set a minimal self object that just needs to exist
  global.self = global;
}
