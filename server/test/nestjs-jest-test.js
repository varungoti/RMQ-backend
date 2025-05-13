/**
 * Simple Jest test script for NestJS module loading
 */

// Load reflect-metadata
require('reflect-metadata');

describe('NestJS Module Loading in Jest', () => {
  
  // Test @nestjs/common loading
  test('@nestjs/common should load correctly', () => {
    const common = require('@nestjs/common');
    expect(common).toBeDefined();
    expect(typeof common.Injectable).toBe('function');
    
    console.log('common module keys:', Object.keys(common).slice(0, 5));
  });
  
  // Test @nestjs/core loading
  test('@nestjs/core should load correctly', () => {
    const core = require('@nestjs/core');
    expect(core).toBeDefined();
    expect(core.NestFactory).toBeDefined();
    
    console.log('core module keys:', Object.keys(core).slice(0, 5));
  });
  
  // Test @nestjs/testing loading
  test('@nestjs/testing should load correctly', () => {
    const testing = require('@nestjs/testing');
    expect(testing).toBeDefined();
    expect(testing.Test).toBeDefined();
    
    console.log('testing module keys:', Object.keys(testing));
    console.log('Test type:', typeof testing.Test);
    
    // Check if Test.createTestingModule is available
    if (testing.Test) {
      console.log('Test.createTestingModule exists:', typeof testing.Test.createTestingModule === 'function');
    }
  });
  
  // Test using Test.createTestingModule
  test('Test.createTestingModule should work', () => {
    const { Test, TestingModule } = require('@nestjs/testing');
    expect(Test).toBeDefined();
    expect(typeof Test.createTestingModule).toBe('function');
    
    const testModule = Test.createTestingModule({
      imports: [],
      controllers: [],
      providers: []
    });
    
    expect(testModule).toBeDefined();
    expect(typeof testModule.compile).toBe('function');
  });
  
  // Test module inheritance and class extending
  test('Class inheritance should work', () => {
    class BaseClass {}
    class ChildClass extends BaseClass {}
    
    expect(ChildClass.prototype instanceof BaseClass).toBe(true);
  });
  
  // Check module paths
  test('Module paths should include node_modules', () => {
    console.log('Module paths:', module.paths);
    expect(module.paths.some(path => path.includes('node_modules'))).toBe(true);
  });
}); 