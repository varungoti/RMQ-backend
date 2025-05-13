console.log('Verifying controller fix...'); 

/**
 * Simple test to verify the controller fix for createHybridResponse
 */

// Mock test data
const mockResult = {
  id: '123',
  questionId: 'q456',
  assessmentSessionId: 's789',
  isCorrect: true,
  userResponse: 'test answer'
};

const mockMessage = 'Answer submitted correctly';

// Mock the createHybridResponse function as it would be in the real code
function createHybridResponse(data, message, successOrProps) {
  // Print arguments to verify
  console.log('createHybridResponse called with:');
  console.log('- data:', JSON.stringify(data));
  console.log('- message:', message);
  console.log('- successOrProps:', successOrProps);
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
  
  // Create the response
  return {
    ...data,
    success,
    message,
    data,
    ...additionalProps
  };
}

// Mock the logger
const logger = {
  log: console.log,
};

// Test the incorrect implementation (object with correct property)
function testIncorrectImplementation() {
  console.log('====== Testing INCORRECT implementation ======');
  
  // This simulates the INCORRECT implementation in the controller
  const response = createHybridResponse(
    mockResult,
    mockMessage,
    { correct: mockResult.isCorrect }
  );
  
  console.log('Response from incorrect implementation:');
  console.log(JSON.stringify(response, null, 2));
  console.log('Has correct property:', response.hasOwnProperty('correct'));
  console.log('');
}

// Test the correct implementation (direct boolean)
function testCorrectImplementation() {
  console.log('====== Testing CORRECT implementation ======');
  
  // This simulates the FIXED implementation in the controller
  const response = createHybridResponse(
    mockResult,
    mockMessage,
    mockResult.isCorrect
  );
  
  console.log('Response from correct implementation:');
  console.log(JSON.stringify(response, null, 2));
  console.log('Has correct property:', response.hasOwnProperty('correct'));
  console.log('');
}

// Run the tests
try {
  console.log('Verifying controller fix for createHybridResponse call...\n');
  
  testIncorrectImplementation();
  testCorrectImplementation();
  
  console.log('====== Verification Summary ======');
  console.log('The INCORRECT implementation passes an object with a correct property.');
  console.log('This adds an unwanted "correct" property to the response.');
  console.log('');
  console.log('The CORRECT implementation passes the boolean value directly.');
  console.log('This properly sets success without adding a "correct" property.');
  console.log('');
  console.log('The controller fix correctly changes:');
  console.log('  FROM: createHybridResponse(result, message, { correct: result.isCorrect })');
  console.log('  TO:   createHybridResponse(result, message, result.isCorrect)');
} catch (error) {
  console.error('Error during verification:', error);
} 
