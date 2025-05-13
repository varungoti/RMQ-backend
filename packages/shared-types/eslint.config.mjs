import baseConfig from '@repo/config/eslint.config.base.mjs';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  ...baseConfig,
  // Add any specific overrides for this package if needed
  // (Usually not needed for a simple types package)
  // {
  //   files: ['src/specific-file.ts'],
  //   rules: { ... }
  // }
]; 