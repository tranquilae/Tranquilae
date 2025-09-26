// Browser polyfills for server-side compatibility
// This must run as early as possible to prevent "self is not defined" errors

// Global polyfills for Node.js environment
if (typeof globalThis !== 'undefined') {
  // Set self to global if it doesn't exist
  if (typeof globalThis.self === 'undefined') {
    globalThis.self = globalThis;
  }
  
  // Set other browser globals to undefined if they don't exist
  if (typeof globalThis.window === 'undefined') {
    globalThis.window = undefined;
  }
  if (typeof globalThis.navigator === 'undefined') {
    globalThis.navigator = undefined;
  }
  if (typeof globalThis.document === 'undefined') {
    globalThis.document = undefined;
  }
  if (typeof globalThis.location === 'undefined') {
    globalThis.location = undefined;
  }
}

// Fallback for older Node.js versions
if (typeof global !== 'undefined') {
  if (typeof global.self === 'undefined') {
    global.self = global;
  }
  if (typeof global.window === 'undefined') {
    global.window = undefined;
  }
  if (typeof global.navigator === 'undefined') {
    global.navigator = undefined;
  }
  if (typeof global.document === 'undefined') {
    global.document = undefined;
  }
  if (typeof global.location === 'undefined') {
    global.location = undefined;
  }
}

// Even more aggressive - set on the actual global scope
if (typeof self === 'undefined' && typeof global !== 'undefined') {
  // This creates a global 'self' that points to the global object
  Object.defineProperty(global, 'self', {
    value: global,
    writable: true,
    enumerable: false,
    configurable: true
  });
}

// Export empty object for import compatibility
module.exports = {};
