// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import baseConfig from '../packages/config/eslint.config.base.mjs';
import { createRequire } from 'module';

// Use createRequire to import CommonJS modules
const require = createRequire(import.meta.url);
const noIncorrectHybridResponse = require('./src/eslint-rules/no-incorrect-hybrid-response');

/** @type {import('eslint').Linter.FlatConfig[]} */
export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'], // Ignore self
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked, // Or recommended if not type-checking
  eslintPluginPrettierRecommended, // Ensure Prettier runs last
  {
    languageOptions: {
      globals: {
        ...globals.node,
        // ...globals.jest, // Add if using Jest
      },
      // ecmaVersion: 5, // Original value? Seems old.
      // sourceType: 'module',
      parserOptions: {
        project: true, // Ensure TS project is found
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Original server rules, e.g.:
       '@typescript-eslint/no-explicit-any': 'off',
       '@typescript-eslint/no-floating-promises': 'warn',
       '@typescript-eslint/no-unsafe-argument': 'warn',
       // Add our custom rule
       'no-incorrect-hybrid-response': 'error'
      // Add other original rules here
    },
    plugins: {
      // Add our custom plugin
      'custom': {
        rules: {
          'no-incorrect-hybrid-response': noIncorrectHybridResponse
        }
      }
    }
  },
);