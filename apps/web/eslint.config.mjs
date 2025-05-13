import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize FlatCompat
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // Use FlatCompat to extend existing eslintrc configurations
  ...compat.extends("next/core-web-vitals"), 
  // Add other specific rules or overrides for the web app here
  {
    // Example: Ensure TS files are targeted if not covered by extends
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: {
       // Add specific rules if needed
    }
  }
];
