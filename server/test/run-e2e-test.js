/**
 * Custom E2E Test Runner
 * 
 * This script runs E2E tests with a modified Jest configuration
 * that avoids module mocking issues with NestJS.
 * 
 * Usage:
 *   node test/run-e2e-test.js <test-file-pattern>
 * 
 * Example:
 *   node test/run-e2e-test.js test/minimal-assessment.e2e-spec.ts
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure we're in the server directory
const serverDir = __dirname.includes('test') 
  ? path.resolve(__dirname, '..')
  : __dirname;

// Create a temporary Jest config that doesn't import setup-jest.js
const tempConfigPath = path.join(serverDir, 'test', 'temp-jest-config.js');

// Get test pattern from command line arguments
const testPattern = process.argv[2] || 'test/**/*.e2e-spec.ts';

// Create a temporary Jest config 
const tempConfig = `
/**
 * Temporary Jest configuration for E2E tests
 * This config avoids module mocking issues with NestJS
 */
module.exports = {
  moduleFileExtensions: [
    "js",
    "json",
    "ts"
  ],
  rootDir: ".",
  testEnvironment: "node",
  testRegex: ".e2e-spec.ts$",
  transform: {
    "^.+\\.ts$": ["ts-jest", {
      isolatedModules: true
    }]
  },
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/../src/$1",
    "^(entities|dto|auth|common)/(.*)$": "<rootDir>/../src/$1/$2",
    "^\\.\\./(dto|entities|auth|common)/(.*)$": "<rootDir>/../src/$1/$2"
  },
  setupFiles: [
    "<rootDir>/setup-env.ts"
    // setup-jest.js intentionally removed
  ],
  moduleDirectories: [
    "../node_modules",
    "node_modules",
    "../../node_modules"
  ],
  testPathIgnorePatterns: [
    "/node_modules/"
  ],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true
};
`;

// Write the temporary config file
fs.writeFileSync(tempConfigPath, tempConfig);

console.log(`Running tests: ${testPattern}`);
console.log('Using temporary Jest config without module mocking');

// Build the command to run Jest with the temporary config
const cmd = 'node';
const args = [
  './node_modules/jest/bin/jest.js',
  '--config',
  tempConfigPath,
  '--runInBand',
  '--verbose',
  testPattern
];

// Spawn the Jest process
const jest = spawn(cmd, args, { stdio: 'inherit', cwd: serverDir });

// Handle process exit
jest.on('close', (code) => {
  // Clean up temporary config file
  try {
    fs.unlinkSync(tempConfigPath);
    console.log('Temporary Jest config removed');
  } catch (err) {
    console.error('Error removing temporary Jest config:', err.message);
  }
  
  console.log(`Jest process exited with code ${code}`);
  process.exit(code);
}); 