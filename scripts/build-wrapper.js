#!/usr/bin/env node

// Build wrapper script to ensure polyfills are loaded before Next.js
console.log('🚀 Starting Tranquilae build with polyfills...');

// Load polyfills immediately
require('../lib/startup-polyfill.js');

// Ensure self is defined globally
if (typeof global !== 'undefined' && typeof global.self === 'undefined') {
  global.self = global;
  console.log('✅ Global "self" polyfill applied');
}

// Also set it on globalThis
if (typeof globalThis !== 'undefined' && typeof globalThis.self === 'undefined') {
  globalThis.self = global || globalThis;
  console.log('✅ GlobalThis "self" polyfill applied');
}

// Now run Next.js build
const { spawn } = require('child_process');
const path = require('path');

// Use the actual Next.js CLI entry point instead of the shell wrapper
const nextCli = path.resolve(__dirname, '../node_modules/next/dist/bin/next');
const build = spawn('node', ['--max-old-space-size=4096', nextCli, 'build'], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: {
    ...process.env,
    // Ensure self is available in child processes
    NODE_OPTIONS: '--max-old-space-size=4096 --require ' + path.resolve(__dirname, '../lib/startup-polyfill.js')
  }
});

build.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Build completed successfully!');
  } else {
    console.error('❌ Build failed with exit code:', code);
  }
  process.exit(code);
});

build.on('error', (error) => {
  console.error('❌ Build error:', error);
  process.exit(1);
});