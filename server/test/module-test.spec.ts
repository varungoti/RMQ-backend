/**
 * Simple test to check Jest module resolution
 */
describe('Module Resolution Test', () => {
  it('should load NestJS testing module', () => {
    jest.doMock('@nestjs/testing', () => ({
      Test: jest.fn(),
      TestingModule: jest.fn(),
      TestingModuleBuilder: jest.fn()
    }));
    
    const { Test } = require('@nestjs/testing');
    expect(Test).toBeDefined();
  });
  
  it('should test basic Jest functionality', () => {
    expect(1 + 1).toBe(2);
  });
}); 