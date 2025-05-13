import { createHybridResponse } from './response-helper';

describe('Response Helper Utilities', () => {
  describe('createHybridResponse', () => {
    // Test data
    const testResult = {
      id: '123',
      isCorrect: true,
      question: { id: 'q1', text: 'Test question' },
      assessmentSession: { id: 's1', status: 'in-progress' }
    };
    
    it('should NOT add a correct property when passing a boolean as the third parameter', () => {
      // CORRECT usage pattern
      const message = 'Answer submitted correctly';
      const correctResponse = createHybridResponse(
        testResult,
        message,
        testResult.isCorrect
      );
      
      // Verify the correct property is NOT added
      expect(correctResponse).not.toHaveProperty('correct');
      
      // Verify the success property is set correctly
      expect(correctResponse).toHaveProperty('success', true);
      
      // Verify original data properties are preserved
      expect(correctResponse).toHaveProperty('id', testResult.id);
      expect(correctResponse).toHaveProperty('isCorrect', testResult.isCorrect);
    });
    
    it('should add a correct property when passing an object as the third parameter', () => {
      // INCORRECT usage pattern (for demonstration purposes)
      const message = 'Answer submitted correctly';
      const incorrectResponse = createHybridResponse(
        testResult,
        message,
        { correct: testResult.isCorrect }
      );
      
      // Verify the correct property IS added
      expect(incorrectResponse).toHaveProperty('correct', true);
      
      // Verify the success property is still set correctly
      expect(incorrectResponse).toHaveProperty('success', true);
      
      // Verify original data properties are preserved
      expect(incorrectResponse).toHaveProperty('id', testResult.id);
      expect(incorrectResponse).toHaveProperty('isCorrect', testResult.isCorrect);
    });
    
    it('should handle null data correctly', () => {
      const response = createHybridResponse(null, 'No data', true);
      
      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('message', 'No data');
      expect(response).toHaveProperty('data', null);
    });
    
    it('should handle primitive data correctly', () => {
      const response = createHybridResponse('string value', 'String data', true);
      
      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('message', 'String data');
      expect(response).toHaveProperty('data', 'string value');
    });
    
    it('should work with the correct implementation used in assessment.controller.ts', () => {
      // Simulate the controller scenario
      const result = {
        id: '123',
        isCorrect: true,
        question: { id: 'q1' },
        assessmentSession: { id: 's1' }
      };
      
      const message = result.isCorrect 
        ? 'Answer submitted correctly' 
        : 'Answer submitted incorrectly';
      
      // CORRECT implementation
      const response = createHybridResponse(
        result,
        message,
        result.isCorrect
      );
      
      // Verify the response has the expected format
      expect(response).not.toHaveProperty('correct');
      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('message', 'Answer submitted correctly');
      expect(response).toHaveProperty('id', '123');
      expect(response).toHaveProperty('isCorrect', true);
    });
  });
});

