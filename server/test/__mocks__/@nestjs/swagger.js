/**
 * Mock implementation for @nestjs/swagger module
 */

// Create mock decorator factory
const createMockDecorator = (name) => {
  return function(...args) {
    return function(target, key) {
      // This is a no-op decorator for testing
    };
  };
};

// Mock function factory (instead of jest.fn)
const mockFn = () => function() {};

module.exports = {
  ApiProperty: createMockDecorator('ApiProperty'),
  ApiPropertyOptional: createMockDecorator('ApiPropertyOptional'),
  ApiTags: createMockDecorator('ApiTags'),
  ApiOperation: createMockDecorator('ApiOperation'),
  ApiResponse: createMockDecorator('ApiResponse'),
  ApiBody: createMockDecorator('ApiBody'),
  ApiParam: createMockDecorator('ApiParam'),
  ApiQuery: createMockDecorator('ApiQuery'),
  ApiExtraModels: createMockDecorator('ApiExtraModels'),
  getSchemaPath: (modelName) => modelName,
  ApiOkResponse: createMockDecorator('ApiOkResponse'),
  ApiUnauthorizedResponse: createMockDecorator('ApiUnauthorizedResponse'),
  ApiBadRequestResponse: createMockDecorator('ApiBadRequestResponse'),
  ApiCreatedResponse: createMockDecorator('ApiCreatedResponse'),
  ApiNotFoundResponse: createMockDecorator('ApiNotFoundResponse'),
  ApiHeader: createMockDecorator('ApiHeader'),
  ApiSecurity: createMockDecorator('ApiSecurity'),
  ApiExcludeEndpoint: createMockDecorator('ApiExcludeEndpoint'),
  ApiExcludeController: createMockDecorator('ApiExcludeController'),
  ApiConsumes: createMockDecorator('ApiConsumes'),
  ApiProduces: createMockDecorator('ApiProduces'),
  ApiBearerAuth: createMockDecorator('ApiBearerAuth'),
  SwaggerModule: {
    createDocument: mockFn(),
    setup: mockFn()
  }
}; 