/**
 * Mock implementation for dotenv
 * This avoids the package.json resolution issues in tests
 */

module.exports = {
  config: jest.fn().mockReturnValue({ parsed: {}, error: undefined }),
  parse: jest.fn().mockReturnValue({}),
  configDotenv: jest.fn(),
  populate: jest.fn()
}; 