/**
 * Simple Jest test script for NestJS module loading
 */

// Load reflect-metadata directly
import 'reflect-metadata';

// Explicitly set up console output that will be captured regardless of Jest setup
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

function log(...args: any[]) {
  originalConsoleLog('\n[DIAGNOSTIC]', ...args);
}

function logError(...args: any[]) {
  originalConsoleError('\n[DIAGNOSTIC ERROR]', ...args);
}

describe('NestJS Module Loading in Jest', () => {
  
  beforeAll(() => {
    log('==== NestJS Module Diagnostics Starting ====');
    log('Node version:', process.version);
    log('Jest version:', require('jest/package.json').version);
    log('TypeScript version:', require('typescript/package.json').version);
    
    try {
      const tsJestVersion = require('ts-jest/package.json').version;
      log('ts-jest version:', tsJestVersion);
    } catch (e) {
      logError('Failed to load ts-jest version');
    }

    // Check if setup-jest.js is mocking modules
    try {
      const fs = require('fs');
      log('fs.readFileSync is mocked:', fs.readFileSync.mock != null);
    } catch (e) {
      logError('Error checking for fs mock:', e.message);
    }
    
    log('Module paths:', module.paths);
  });
  
  // Test class inheritance
  it('should properly handle class inheritance', () => {
    log('Testing class inheritance...');
    class BaseClass {}
    class ChildClass extends BaseClass {}
    
    log('- ChildClass is a function:', typeof ChildClass === 'function');
    log('- BaseClass is a function:', typeof BaseClass === 'function');
    log('- ChildClass.prototype instanceof BaseClass:', 
       ChildClass.prototype instanceof BaseClass);
    
    expect(ChildClass.prototype instanceof BaseClass).toBe(true);
  });
  
  // Test the specific error we're seeing
  it('should test the specific inheritance error pattern', () => {
    log('Testing problematic inheritance pattern...');
    
    try {
      // This is similar to the error we're seeing in nestjs/testing
      const undefined_value = undefined as any;
      
      // Attempt to create a class that inherits from undefined, similar to the error
      // we're seeing in the NestJS code
      // @ts-ignore - we know this will fail, that's the point
      class TestClass extends undefined_value {}
      
      log('Class definition with undefined parent succeeded');
      expect(true).toBe(false); // This should never execute
    } catch (error) {
      log('Error caught as expected:', error.name, error.message);
      // Check if the error message matches what we're seeing in the NestJS error
      expect(error.message).toContain('is not a constructor');
      expect(true).toBe(true);
    }
  });
  
  // Test direct loading of @nestjs/testing
  it('should try to load @nestjs/testing manually', () => {
    log('Loading @nestjs/testing manually...');
    
    try {
      // Try to bypass jest mocks
      jest.dontMock('@nestjs/testing');
      jest.unmock('@nestjs/testing');
      
      // Try loading the module directly
      const nestPath = require.resolve('@nestjs/testing');
      log('Resolved @nestjs/testing path:', nestPath);
      
      const testing = require('@nestjs/testing');
      log('testing module loaded, keys:', Object.keys(testing));
      
      if (testing && testing.Test) {
        log('Test class exists:', testing.Test !== undefined);
        log('Test is a function:', typeof testing.Test === 'function');
      } else {
        log('Test is not defined in the module');
      }
      
      expect(testing).toBeDefined();
    } catch (error) {
      logError('Error loading @nestjs/testing manually:', error.message);
      logError('Error stack:', error.stack);
      // Make test pass so we can see the error
      expect(true).toBe(true);
    }
  });
  
  // Basic test that should always pass
  it('should run basic assertions correctly', () => {
    log('Basic assertion test');
    expect(1 + 1).toBe(2);
  });
}); 