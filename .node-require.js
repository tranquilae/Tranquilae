// Node.js require polyfill for browser globals
// This file is loaded automatically by Node.js

// Comprehensive polyfill for browser globals in Node.js environment
if (typeof window === 'undefined') {
  // Define 'self' to point to global if not already defined
  if (typeof global.self === 'undefined') {
    global.self = global;
  }
  
  // Also ensure 'self' is available in the current scope
  if (typeof self === 'undefined') {
    global.self = global;
  }
  
  // Add window object if needed
  if (typeof global.window === 'undefined') {
    global.window = {};
  }
  
  // Add navigator object if needed
  if (typeof global.navigator === 'undefined') {
    global.navigator = { userAgent: 'Node.js' };
  }
  
  // Add document object if needed
  if (typeof global.document === 'undefined') {
    global.document = {};
  }
}
