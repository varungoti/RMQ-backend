/**
 * Special Jest configuration for debugging NestJS issues
 */
module.exports = {
  bail: false,
  verbose: true,
  moduleFileExtensions: [
    "js",
    "json",
    "ts"
  ],
  rootDir: ".",
  testEnvironment: "node",
  transform: {
    "^.+\\.ts$": ["ts-jest", {
      isolatedModules: true,
      diagnostics: false
    }]
  },
  transformIgnorePatterns: [
    "/node_modules/"
  ],
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/../src/$1",
    "^../package\\.json$": "<rootDir>/__mocks__/package.json",
    "^(entities|dto|auth|common)/(.*)$": "<rootDir>/../src/$1/$2",
    "^\\.\\./(dto|entities|auth|common)/(.*)$": "<rootDir>/../src/$1/$2",
    "^dotenv$": "<rootDir>/__mocks__/dotenv.js",
    "^@nestjs/(.*)$": "<rootDir>/../node_modules/@nestjs/$1",
    "typeorm": "<rootDir>/../node_modules/typeorm"
  },
  setupFiles: [
    "<rootDir>/setup-env.ts"
    // Removed setup-jest.js which is mocking modules
  ],
  moduleDirectories: [
    "../node_modules",
    "node_modules",
    "../../node_modules"
  ],
  testPathIgnorePatterns: [
    "/node_modules/"
  ],
  // No globals section to avoid ts-jest config issues
  // No setupFilesAfterEnv to avoid additional setup that might interfere
  
  // Always print out console logs
  silent: false
}; 