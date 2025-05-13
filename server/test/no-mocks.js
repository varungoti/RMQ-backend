/**
 * Script to unload all Jest module mocks
 * Run this before any test that needs to directly import NestJS modules
 */

// Save original console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

function logDebug(...args) {
  originalConsoleLog('[DEBUG]', ...args);
}

logDebug('No-mocks script running - clearing jest mocks');

// Try to restore original fs module
try {
  jest.dontMock('fs');
  jest.resetModules();
  logDebug('Unmocked fs module');
} catch (error) {
  originalConsoleError('Error unmocking fs:', error.message);
}

// Try to restore original path module
try {
  jest.dontMock('path');
  logDebug('Unmocked path module');
} catch (error) {
  originalConsoleError('Error unmocking path:', error.message);
}

// Try to restore NestJS modules
const modulesToUnmock = [
  '@nestjs/testing',
  '@nestjs/common',
  '@nestjs/core',
  'typeorm',
  'reflect-metadata',
  'class-transformer',
  'class-validator'
];

modulesToUnmock.forEach(moduleName => {
  try {
    jest.dontMock(moduleName);
    logDebug(`Unmocked ${moduleName}`);
  } catch (error) {
    originalConsoleError(`Error unmocking ${moduleName}:`, error.message);
  }
});

// Ensure reflect-metadata is loaded
try {
  require('reflect-metadata');
  logDebug('Loaded reflect-metadata');
} catch (error) {
  originalConsoleError('Error loading reflect-metadata:', error.message);
}

// Output module paths
logDebug('Module paths:', module.paths);

logDebug('No-mocks script completed'); 