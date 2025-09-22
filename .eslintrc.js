module.exports = {
  root: true,
  extends: ['next/core-web-vitals'],
  rules: {
    // Basic rules
    'prefer-const': 'warn',
    'no-var': 'error',
    'no-console': 'off', // Allow console for debugging
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    
    // React rules
    'react/no-unescaped-entities': 'off',
    'react/display-name': 'off',
  },
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'out/',
    'build/',
    'dist/',
    '*.js'
  ]
};
