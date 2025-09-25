// Early polyfill for browser globals used by third-party packages
// This must be loaded before any modules that reference 'self'

// Only define globals in Node.js environment (not browser)
if (typeof window === 'undefined') {
  // Define 'self' to point to global
  if (typeof self === 'undefined') {
    global.self = global;
  }
  
  // Add minimal window object if needed
  if (typeof global.window === 'undefined') {
    global.window = {};
  }
  
  // Add minimal navigator object if needed
  if (typeof global.navigator === 'undefined') {
    global.navigator = {};
  }
}

// Also ensure the self reference exists at the module level
if (typeof self === 'undefined') {
  global.self = global;
}

module.exports = {};
