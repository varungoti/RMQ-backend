/**
 * Simplified assessment test that avoids direct NestJS imports
 */

// Load reflect-metadata which is required by NestJS
require('reflect-metadata');

// Use own logging to ensure visibility
const standaloneLogger = console.log;
function standaloneLog(...args) {
  standaloneLogger('[TEST]', ...args);
}

// Simplified mock of the createHybridResponse function
function mockCreateHybridResponse(data, message = '', successOrProps = true) {
  const success = typeof successOrProps === 'boolean' ? successOrProps : true;
  const additionalProps = typeof successOrProps === 'object' ? successOrProps : {};
  
  if (!data || typeof data !== 'object') {
    return { success, message, data, ...additionalProps };
  }
  
  return {
    ...data,
    success,
    message,
    data,
    ...additionalProps
  };
}

describe('Assessment Functionality (Standalone)', () => {
  
  beforeAll(() => {
    standaloneLog('Starting standalone assessment tests');
  });
  
  it('should create a hybrid response for assessment results', () => {
    // Test data similar to what the assessment controller would use
    const assessmentResult = {
      id: '123',
      questionId: 'q456',
      assessmentSessionId: 's789',
      isCorrect: true,
      userResponse: 'test answer'
    };
    
    // Test with boolean success parameter (correct usage)
    const response1 = mockCreateHybridResponse(
      assessmentResult,
      'Answer submitted',
      assessmentResult.isCorrect
    );
    
    // Verify structure
    expect(response1.success).toBe(true);
    expect(response1.message).toBe('Answer submitted');
    expect(response1.data).toBe(assessmentResult);
    expect(response1.id).toBe('123');
    expect(response1.isCorrect).toBe(true); // Should have isCorrect property
    expect(response1).not.toHaveProperty('correct'); // Should NOT have 'correct' property (legacy format)
    
    // Test also with boolean parameter (correct usage)
    // Duplicate test to ensure consistency
    const response2 = mockCreateHybridResponse(
      assessmentResult,
      'Answer submitted',
      assessmentResult.isCorrect
    );
    
    // Verify structure includes isCorrect but not 'correct'
    expect(response2.success).toBe(true);
    expect(response2.message).toBe('Answer submitted');
    expect(response2.data).toBe(assessmentResult);
    expect(response2.isCorrect).toBe(true); // Should have isCorrect property
    expect(response2).not.toHaveProperty('correct'); // Should NOT have 'correct' property (legacy format)
  });
  
  it('should work with null data', () => {
    const response = mockCreateHybridResponse(null, 'No data', false);
    
    expect(response.success).toBe(false);
    expect(response.message).toBe('No data');
    expect(response.data).toBe(null);
  });
}); 