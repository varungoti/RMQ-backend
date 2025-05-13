/**
 * Mock implementation for class-validator module
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

// Export mock decorators with the same names as the real ones
module.exports = {
  IsUUID: createMockDecorator('IsUUID'),
  IsOptional: createMockDecorator('IsOptional'),
  IsNumber: createMockDecorator('IsNumber'),
  Min: createMockDecorator('Min'),
  Max: createMockDecorator('Max'),
  IsString: createMockDecorator('IsString'),
  IsEnum: createMockDecorator('IsEnum'),
  IsArray: createMockDecorator('IsArray'),
  IsUrl: createMockDecorator('IsUrl'),
  IsBoolean: createMockDecorator('IsBoolean'),
  ValidateNested: createMockDecorator('ValidateNested'),
  IsNotEmpty: createMockDecorator('IsNotEmpty'),
  IsEmail: createMockDecorator('IsEmail'),
  IsDate: createMockDecorator('IsDate'),
  IsPositive: createMockDecorator('IsPositive'),
  IsInt: createMockDecorator('IsInt'),
  IsObject: createMockDecorator('IsObject'),
  MinLength: createMockDecorator('MinLength'),
  MaxLength: createMockDecorator('MaxLength'),
  Length: createMockDecorator('Length'),
  Matches: createMockDecorator('Matches'),
  IsDefined: createMockDecorator('IsDefined'),
  IsIn: createMockDecorator('IsIn'),
  IsJSON: createMockDecorator('IsJSON'),
  ValidateBy: createMockDecorator('ValidateBy'),
  ValidationOptions: {},
  ValidationArguments: {},
  // Add any other decorators that might be needed
}; 