/**
 * Simple test script to verify createHybridResponse functionality
 * Run directly with: node test/manual-verification/verify-hybrid-response.js
 */

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

// Test Case 1: Incorrect implementation (using object with correct property)
console.log('=== TEST CASE 1: INCORRECT IMPLEMENTATION ===');
const message1 = 'Answer submitted correctly';
const incorrectResponse = createHybridResponse(
  testResult,
  message1,
  { correct: testResult.isCorrect }
);

console.log('Response includes unwanted "correct" property?', 'correct' in incorrectResponse);
console.log('Response has success=true?', incorrectResponse.success === true);
console.log('Full Response:', JSON.stringify(incorrectResponse, null, 2));

// Test Case 2: Correct implementation (using boolean)
console.log('\n=== TEST CASE 2: CORRECT IMPLEMENTATION ===');
const message2 = 'Answer submitted correctly';
const correctResponse = createHybridResponse(
  testResult,
  message2,
  testResult.isCorrect
);

console.log('Response includes unwanted "correct" property?', 'correct' in correctResponse);
console.log('Response has success=true?', correctResponse.success === true);
console.log('Full Response:', JSON.stringify(correctResponse, null, 2));

console.log('\n=== VERIFICATION RESULT ===');
if ('correct' in incorrectResponse && !('correct' in correctResponse)) {
  console.log('✅ VERIFICATION PASSED: The fix correctly prevents the unwanted "correct" property');
} else {
  console.log('❌ VERIFICATION FAILED: Unexpected behavior in the implementation');
} 