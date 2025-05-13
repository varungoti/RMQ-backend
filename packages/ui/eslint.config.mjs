// packages/ui/eslint.config.mjs
import baseConfig from '@repo/config/eslint.config.base.mjs'; // Note: Base config includes React plugin

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  ...baseConfig,
  {
    // Add any specific overrides for this UI package
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Example: Allow default exports for components in this package
      // 'import/no-default-export': 'off',
    },
  },
]; 