/**
 * Simple direct test for the createHybridResponse function
 * 
 * This script demonstrates the proper usage of the createHybridResponse function
 * and illustrates why passing an object with a 'correct' property is problematic.
 * 
 * Run this with: node test/hybrid-response-test.js
 */

// Helper for logging formatted output
function logResult(result) {
  console.log('Result:');
  console.log(JSON.stringify(result, null, 2));
  console.log('Has success property:', result.hasOwnProperty('success'));
  console.log('Has correct property:', result.hasOwnProperty('correct'));
  console.log('');
}

// Simplified version of the actual function
function createHybridResponseForTest(data, message, successOrProps) {
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

// Run tests
try {
  console.log('Testing createHybridResponse function...\n');
  
  // Test case 1: Basic data with isCorrect true
  const testCase1 = {
    id: '123',
    userResponse: 'A',
    isCorrect: true,
    question: { id: 'q456' }
  };
  
  console.log('Test Case 1: With boolean parameter (CORRECT USAGE)');
  const result1 = createHybridResponseForTest(testCase1, 'Success message', true);
  logResult(result1);
  
  // Test case 2: Basic data with isCorrect false
  const testCase2 = {
    id: '123',
    userResponse: 'B',
    isCorrect: false,
    question: { id: 'q456' }
  };
  
  console.log('Test Case 2: With boolean false parameter (CORRECT USAGE)');
  const result2 = createHybridResponseForTest(testCase2, 'Error message', false);
  logResult(result2);
  
  // Test case 3: Testing with null data
  console.log('Test Case 3: With null data');
  const result3 = createHybridResponseForTest(null, 'Null data message', true);
  logResult(result3);
  
  // Test case 4: Testing with object parameter for successOrProps
  const testCase4 = {
    id: '123',
    userResponse: 'C',
    isCorrect: true,
    question: { id: 'q456' }
  };
  
  console.log('Test Case 4: With object parameter (PROBLEMATIC USAGE)');
  const result4 = createHybridResponseForTest(testCase4, 'Custom props message', { correct: true, customProp: 'test' });
  logResult(result4);
  
  // Test case 5: Demonstrating the fix
  console.log('Test Case 5: Controller before fix (PROBLEMATIC)');
  const result5 = createHybridResponseForTest(
    testCase1, 
    'Before fix', 
    { correct: testCase1.isCorrect }
  );
  logResult(result5);
  
  console.log('Test Case 6: Controller after fix (CORRECT)');
  const result6 = createHybridResponseForTest(
    testCase1, 
    'After fix', 
    testCase1.isCorrect
  );
  logResult(result6);
  
  console.log('==== CONCLUSION ====');
  console.log('The createHybridResponse function should be called with a boolean as the third parameter,');
  console.log('not an object with a "correct" property. This prevents duplicate properties in the response');
  console.log('and makes sure tests pass as expected.\n');
  
  console.log('✅ CORRECT:   createHybridResponse(result, message, result.isCorrect)');
  console.log('❌ INCORRECT: createHybridResponse(result, message, { correct: result.isCorrect })');
} catch (error) {
  console.error('Error:', error);
} 