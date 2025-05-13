/**
 * Mock implementation for class-transformer module
 * This provides mock implementations of the various decorators
 * to prevent issues during test execution
 */

// Create mock decorator factory
const createMockDecorator = (name) => {
  return function(...args) {
    return function(target, key) {
      // This is a no-op decorator for testing
    };
  };
};

// Export mock decorators and functions
module.exports = {
  Type: createMockDecorator('Type'),
  Expose: createMockDecorator('Expose'),
  Exclude: createMockDecorator('Exclude'),
  Transform: createMockDecorator('Transform'),
  plainToClass: (cls, plain) => plain,
  classToPlain: (obj) => obj,
  // Add any other transformers that might be needed
}; 