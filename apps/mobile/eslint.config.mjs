// apps/mobile/eslint.config.mjs - Using recommended Expo config
// Assuming you have eslint-config-expo installed
// You might need to run: pnpm --filter mobile add -D eslint-config-expo

// Note: Expo might still use .eslintrc.js - adjust if needed.
// This example assumes flat config (eslint.config.mjs)

import eslintConfigExpo from 'eslint-config-expo';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // Apply Expo recommended settings
  ...eslintConfigExpo,
  
  // Add custom overrides if necessary
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Your custom rules here
      // e.g., 'react/prop-types': 'off'
    }
  }
]; 