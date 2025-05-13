/**
 * Test script for the updated createHybridResponse function
 */

// Mock test data
const mockResult = {
  id: '123',
  questionId: 'q456',
  assessmentSessionId: 's789',
  isCorrect: true,
  userResponse: 'test answer'
};

// Reimplement the updated createHybridResponse function for testing
function createHybridResponse(data, message = '', successOrProps = true) {
  console.log('createHybridResponse called with:');
  console.log('- data:', JSON.stringify(data));
  console.log('- message:', message);
  console.log('- successOrProps:', typeof successOrProps === 'object' ? JSON.stringify(successOrProps) : successOrProps);
  console.log('- type of successOrProps:', typeof successOrProps);
  
  // Determine the success value and additional properties
  const success = typeof successOrProps === 'boolean' ? successOrProps : true;
  const additionalProps = typeof successOrProps === 'object' ? successOrProps : {};
  
  // Handle null or undefined data
  if (data === null || data === undefined) {
    return {
      success,
      message,
      data: null,
      ...additionalProps
    };
  }

  // If data is already a response wrapper, return it
  if (data && typeof data === 'object' && 'success' in data) {
    return data;
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

  // Create the response by combining the data, wrapper properties, and any additional properties
  const result = {
    ...data,
    success,
    message: message || '',
    data,
    ...additionalProps
  };
  
  return result;
}

// Test cases
function runTests() {
  console.log('======================================');
  console.log('TESTING UPDATED createHybridResponse FUNCTION');
  console.log('======================================\n');
  
  // Test Case 1: Boolean parameter (CORRECT USAGE)
  console.log('Test Case 1: Boolean parameter (CORRECT USAGE)');
  const result1 = createHybridResponse(
    mockResult,
    'Your answer was submitted correctly!',
    true
  );
  console.log('Response:');
  console.log(JSON.stringify(result1, null, 2));
  console.log('Has correct property:', result1.hasOwnProperty('correct'));
  console.log('Success value:', result1.success);
  console.log('\n');
  
  // Test Case 2: Object parameter (USE WITH CAUTION)
  console.log('Test Case 2: Object parameter (USE WITH CAUTION)');
  const result2 = createHybridResponse(
    mockResult,
    'Your answer was submitted correctly!',
    { additionalProp: 'test value' }
  );
  console.log('Response:');
  console.log(JSON.stringify(result2, null, 2));
  console.log('Has additionalProp property:', result2.hasOwnProperty('additionalProp'));
  console.log('additionalProp value:', result2.additionalProp);
  console.log('Success value:', result2.success);
  console.log('\n');
  
  // Test Case 3: Object with correct property (INCORRECT USAGE)
  console.log('Test Case 3: Object with correct property (INCORRECT USAGE)');
  const result3 = createHybridResponse(
    mockResult,
    'Your answer was submitted correctly!',
    { correct: mockResult.isCorrect }
  );
  console.log('Response:');
  console.log(JSON.stringify(result3, null, 2));
  console.log('Has correct property:', result3.hasOwnProperty('correct'));
  console.log('correct value:', result3.correct);
  console.log('Success value:', result3.success);
  console.log('\n');
  
  // Test Case 4: Null data
  console.log('Test Case 4: Null data');
  const result4 = createHybridResponse(
    null,
    'No data available',
    true
  );
  console.log('Response:');
  console.log(JSON.stringify(result4, null, 2));
  console.log('Has data property:', result4.hasOwnProperty('data'));
  console.log('Data value:', result4.data);
  console.log('Success value:', result4.success);
  console.log('\n');
  
  // Summary
  console.log('======================================');
  console.log('SUMMARY');
  console.log('======================================');
  console.log('1. When passing a boolean as the third parameter:');
  console.log('   - The success property is set to that boolean value');
  console.log('   - No additional properties are added to the response');
  console.log('\n2. When passing an object as the third parameter:');
  console.log('   - All properties from that object are added to the response');
  console.log('   - This may cause tests to fail if they expect a specific response format');
  console.log('\n3. BEST PRACTICE:');
  console.log('   - Use boolean for the third parameter when possible');
  console.log('   - Avoid passing { correct: result.isCorrect } as it adds an unwanted property');
}

// Run the tests
try {
  runTests();
} catch (error) {
  console.error('Error:', error);
} 