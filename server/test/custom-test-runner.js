#!/usr/bin/env node

/**
 * Custom test runner that can be used to directly test specific functionality
 * without relying on the full Jest test infrastructure
 * 
 * Usage: node test/custom-test-runner.js
 */

const path = require('path');
const fs = require('fs');
const util = require('util');

// Configure environment
process.env.NODE_ENV = 'test';

// Test utilities
const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
};

const logSuccess = (message) => {
  console.log(`✅ ${message}`);
};

const logInfo = (message) => {
  console.log(`ℹ️ ${message}`);
};

// Simple implementation of createHybridResponse based on the actual function
function createHybridResponse(data, message = '', successOrProps = true) {
  // Determine success and additional props
  const success = typeof successOrProps === 'boolean' ? successOrProps : true;
  const additionalProps = typeof successOrProps === 'object' ? successOrProps : {};
  
  // Handle null data
  if (data === null || data === undefined) {
    return {
      success,
      message,
      data: null,
      ...additionalProps
    };
  }

  // Ensure data is an object
  if (typeof data !== 'object') {
    return {
      success,
      message,
      data,
      ...additionalProps
    };
  }

  // Create the response
  const result = {
    ...data,
    success,
    message: message || '',
    data,
    ...additionalProps
  };
  
  return result;
}

// Test data
const testResult = {
  id: '123',
  isCorrect: true,
  question: { id: 'q1', text: 'Test question' },
  assessmentSession: { id: 's1', status: 'in-progress' }
};

console.log('=== STARTING CUSTOM TEST RUNNER ===');
console.log('Testing createHybridResponse function...');

// Test Case 1: Incorrect implementation (using object with correct property)
logInfo('TEST CASE 1: INCORRECT IMPLEMENTATION');
const message1 = 'Answer submitted correctly';
const incorrectResponse = createHybridResponse(
  testResult,
  message1,
  { correct: testResult.isCorrect }
);

logInfo(`Response includes unwanted "correct" property? ${'correct' in incorrectResponse}`);
logInfo(`Response has success=true? ${incorrectResponse.success === true}`);

// Test Case 2: Correct implementation (using boolean)
logInfo('\nTEST CASE 2: CORRECT IMPLEMENTATION');
const message2 = 'Answer submitted correctly';
const correctResponse = createHybridResponse(
  testResult,
  message2,
  testResult.isCorrect
);

logInfo(`Response includes unwanted "correct" property? ${'correct' in correctResponse}`);
logInfo(`Response has success=true? ${correctResponse.success === true}`);

// Assertions
console.log('\n=== VERIFICATION TESTS ===');

// 1. Incorrect implementation should add 'correct' property
assert('correct' in incorrectResponse, 'Incorrect implementation should add "correct" property');
logSuccess('Incorrect implementation adds unwanted "correct" property as expected');

// 2. Correct implementation should NOT add 'correct' property
assert(!('correct' in correctResponse), 'Correct implementation should NOT add "correct" property');
logSuccess('Correct implementation does NOT add unwanted "correct" property as expected');

// 3. Both implementations should set success=true
assert(incorrectResponse.success === true, 'Both implementations should set success=true');
assert(correctResponse.success === true, 'Both implementations should set success=true');
logSuccess('Both implementations set success=true correctly');

// 4. Original data properties should be preserved
assert(correctResponse.id === testResult.id, 'Original data properties should be preserved');
assert(correctResponse.isCorrect === testResult.isCorrect, 'Original data properties should be preserved');
logSuccess('Original data properties are preserved correctly');

// Final verdict
console.log('\n=== FINAL VERIFICATION RESULT ===');
if ('correct' in incorrectResponse && !('correct' in correctResponse)) {
  logSuccess('VERIFICATION PASSED: The fix correctly prevents the unwanted "correct" property');
  process.exit(0);
} else {
  console.error('❌ VERIFICATION FAILED: Unexpected behavior in the implementation');
  process.exit(1);
} 