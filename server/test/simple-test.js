/**
 * Simple test for the createHybridResponse function
 */

// Import the function (adjust path if needed)
const { createHybridResponse } = require('../src/common/utils/response-helper');

// Test cases
function runTests() {
  console.log('Testing createHybridResponse function...\n');
  
  // Test case 1: Basic data with isCorrect true
  const testCase1 = {
    id: '123',
    userResponse: 'A',
    isCorrect: true,
    answeredAt: new Date(),
    question: { id: '456' }
  };
  
  console.log('Test Case 1: With isCorrect=true');
  const result1 = createHybridResponse(testCase1, 'Success message', true);
  logResult(result1);
  
  // Test case 2: Basic data with isCorrect false
  const testCase2 = {
    id: '123',
    userResponse: 'B',
    isCorrect: false,
    answeredAt: new Date(),
    question: { id: '456' }
  };
  
  console.log('\nTest Case 2: With isCorrect=false');
  const result2 = createHybridResponse(testCase2, 'Error message', false);
  logResult(result2);
  
  // Test case 3: Testing with null data
  console.log('\nTest Case 3: With null data');
  const result3 = createHybridResponse(null, 'Null data message', true);
  logResult(result3);
  
  // Test case 4: Testing with object parameter for successOrProps
  const testCase4 = {
    id: '123',
    userResponse: 'C',
    isCorrect: true,
    answeredAt: new Date()
  };
  
  console.log('\nTest Case 4: With object for successOrProps');
  const result4 = createHybridResponse(testCase4, 'Custom props message', { correct: true, customProp: 'test' });
  logResult(result4);
}

// Helper function to log results
function logResult(result) {
  console.log('Result:', JSON.stringify(result, replacer, 2));
  console.log('Has correct property:', result.hasOwnProperty('correct'));
  if (result.hasOwnProperty('correct')) {
    console.log('Correct value:', result.correct);
  }
  console.log('Success value:', result.success);
  
  // Check the structure of the response
  console.log('Response properties:');
  Object.keys(result).forEach(key => {
    console.log(`- ${key}: ${typeof result[key]}`);
  });
}

// Helper function to handle circular references in JSON.stringify
function replacer(key, value) {
  if (key === 'data' && value === this) {
    return '[Circular Reference]';
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
}

// Run the tests
try {
  runTests();
} catch (error) {
  console.error('Error running tests:', error.message);
  console.error(error.stack);
} 