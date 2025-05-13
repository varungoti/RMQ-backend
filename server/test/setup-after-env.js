/**
 * Jest setup file that runs after the test environment is set up
 * This is used for global test configuration and jest-specific mocks
 */

// Set timeout for all tests to 30 seconds
jest.setTimeout(30000);

// Mock all console methods to reduce noise in test output
const originalConsole = { ...console };
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Keep reference to original console for debugging if needed
global.__originalConsole = originalConsole;

// Mock UUID generation for consistent test results
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('00000000-0000-0000-0000-000000000000')
}));

// Set default test values for process.env
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  DATABASE_HOST: 'localhost',
  DATABASE_PORT: '5432',
  DATABASE_USERNAME: 'test_user',
  DATABASE_PASSWORD: 'test_password',
  DATABASE_NAME: 'test_db',
  JWT_SECRET: 'test_jwt_secret',
  JWT_EXPIRATION_TIME: '3600',
  ENABLE_SWAGGER: 'true'
};

// Make console available for debugging when needed
global.debug = function(message, ...args) {
  originalConsole.log(message, ...args);
};

console.log = jest.fn();
console.log('After-env setup complete');

// Add test utilities
global.expectResponseSuccess = function(response) {
  expect(response).toBeDefined();
  expect(response.success).toBe(true);
  return response;
};

global.expectResponseData = function(response) {
  expect(response).toBeDefined();
  expect(response.data).toBeDefined();
  return response.data;
}; 