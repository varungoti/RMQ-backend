// Root prettier.config.mjs
import sharedConfig from '@repo/config/prettier.config.mjs';

/** @type {import('prettier').Config} */
const config = {
  ...sharedConfig,
  // Add any root-specific overrides here if needed
  // Example: Different settings for markdown files
  overrides: [
    {
      files: "*.md",
      options: {
        tabWidth: 4,
      },
    },
  ],
};

export default config; 