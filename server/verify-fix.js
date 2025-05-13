/**
 * Verification script for the createHybridResponse function fix
 * 
 * This script simulates the behavior of the assessment controller without relying
 * on the NestJS framework or server infrastructure.
 */

// Mock implementation of the createHybridResponse function
function createHybridResponse(data, message = '', successOrProps = true) {
  // Determine the success value and additional properties
  const success = typeof successOrProps === 'boolean' ? successOrProps : true;
  const additionalProps = typeof successOrProps === 'object' ? successOrProps : {};
  
  // Handle null or undefined data
  if (data === null || data === undefined) {
    return {
      success,
      message,
      data: null,
      correct: success, // Explicitly add 'correct' for backward compatibility
      ...additionalProps
    };
  }

  // Ensure data is an object
  if (typeof data !== 'object') {
    return {
      success,
      message,
      data,
      correct: success, // Explicitly add 'correct' for backward compatibility  
      ...additionalProps
    };
  }

  // Create the base result structure
  const baseResult = {
    ...data,
    success,
    message: message || undefined,
    data,
    // Set correct property for backward compatibility with tests
    // If data has isCorrect property, use that, otherwise use the success value
    correct: 'isCorrect' in data ? Boolean(data.isCorrect) : success,
    ...additionalProps
  };
  
  return baseResult;
}

// Mock data representing what would come from the assessmentService.submitAnswer method
const mockSubmitAnswerResult = {
  id: '12345',
  userResponse: 'A',
  isCorrect: true,
  answeredAt: new Date(),
  assessmentSession: {
    id: '67890',
    userId: 'user-123'
  },
  question: {
    id: 'question-456',
    text: 'What is 2+2?'
  }
};

// Mock data with isCorrect = false
const mockIncorrectResult = {
  id: '54321',
  userResponse: 'B',
  isCorrect: false,
  answeredAt: new Date(),
  assessmentSession: {
    id: '67890',
    userId: 'user-123'
  },
  question: {
    id: 'question-456',
    text: 'What is 2+2?'
  }
};

// Simulate the controller logic
function simulateControllerLogic() {
  console.log('==== Testing Assessment Controller submitAnswer logic ====');
  
  console.log('\n1. Testing with correct answer (isCorrect = true):');
  const result = mockSubmitAnswerResult;
  const message = result.isCorrect ? 'Answer submitted correctly' : 'Answer submitted but incorrect';
  
  const response = createHybridResponse(
    result,
    message,
    result.isCorrect
  );
  
  console.log('Response includes correct:', response.hasOwnProperty('correct'));
  console.log('correct value:', response.correct);
  console.log('success value:', response.success);
  
  console.log('\n2. Testing with incorrect answer (isCorrect = false):');
  const result2 = mockIncorrectResult;
  const message2 = result2.isCorrect ? 'Answer submitted correctly' : 'Answer submitted but incorrect';
  
  const response2 = createHybridResponse(
    result2,
    message2,
    result2.isCorrect
  );
  
  console.log('Response includes correct:', response2.hasOwnProperty('correct'));
  console.log('correct value:', response2.correct);
  console.log('success value:', response2.success);
  
  console.log('\n==== Test Verification ====');
  
  // Expected test conditions
  const test1Expected = { correct: true, success: true };
  const test2Expected = { correct: false, success: false };
  
  // Actual results
  const test1Actual = { correct: response.correct, success: response.success };
  const test2Actual = { correct: response2.correct, success: response2.success };
  
  // Check test results
  const test1Pass = test1Actual.correct === test1Expected.correct && test1Actual.success === test1Expected.success;
  const test2Pass = test2Actual.correct === test2Expected.correct && test2Actual.success === test2Expected.success;
  
  console.log('Test 1 (correct answer):', test1Pass ? 'PASS ✅' : 'FAIL ❌');
  console.log(`  Expected: correct=${test1Expected.correct}, success=${test1Expected.success}`);
  console.log(`  Actual:   correct=${test1Actual.correct}, success=${test1Actual.success}`);
  
  console.log('Test 2 (incorrect answer):', test2Pass ? 'PASS ✅' : 'FAIL ❌');
  console.log(`  Expected: correct=${test2Expected.correct}, success=${test2Expected.success}`);
  console.log(`  Actual:   correct=${test2Actual.correct}, success=${test2Actual.success}`);
  
  console.log('\nFinal Result:', (test1Pass && test2Pass) ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌');
  
  // Test the condition that previously passed false object rather than boolean
  console.log('\n3. Testing original bug scenario:');
  const responseWithObjectParam = createHybridResponse(
    result,
    message,
    { correct: result.isCorrect } // This was the original bug - passing object instead of boolean
  );
  
  console.log('Response includes correct:', responseWithObjectParam.hasOwnProperty('correct'));
  console.log('correct value:', responseWithObjectParam.correct);
  console.log('success value:', responseWithObjectParam.success);
  
  // Verify fix handles this case correctly
  const bugFixedCorrectly = responseWithObjectParam.correct === result.isCorrect;
  console.log('Bug fixed correctly:', bugFixedCorrectly ? 'YES ✅' : 'NO ❌');
  
  return test1Pass && test2Pass && bugFixedCorrectly;
}

// Run the simulation
const result = simulateControllerLogic();
console.log(`\nVerification result: ${result ? 'PASSED' : 'FAILED'}`); 