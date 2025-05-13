module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^entities/(.*)$': '<rootDir>/entities/$1',
    '^dto/(.*)$': '<rootDir>/dto/$1',
    '^services/(.*)$': '<rootDir>/services/$1',
  },
  setupFilesAfterEnv: ['../test/setup-after-env.js'],
  setupFiles: ['../test/setup-env.ts', '../test/setup-jest.js'],
  moduleDirectories: ['node_modules', '../node_modules'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
      diagnostics: false,
    },
  },
}; 