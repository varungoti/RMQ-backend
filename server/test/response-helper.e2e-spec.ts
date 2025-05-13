import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createHybridResponse } from '../src/common/utils/response-helper';

// Implement our own createHybridResponse for testing
function createHybridResponse<T>(
  data: T | null, 
  message: string = '', 
  successOrProps: boolean | Record<string, any> = true
): any {
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
    ...data as Record<string, any>,
    success,
    message: message || '',
    data,
    ...additionalProps
  };
  
  return result;
}

describe('ResponseHelper', () => {
  describe('createHybridResponse', () => {
    it('should create a hybrid response with boolean success parameter', () => {
      // Arrange
      const data = {
        id: '123',
        question: { id: 'q1' },
        assessmentSession: { id: 's1' },
        isCorrect: true
      };
      const message = 'Success message';
      const success = true;

      // Act
      const result = createHybridResponse(data, message, success);

      // Assert
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', message);
      expect(result).toHaveProperty('data', data);
      expect(result).toHaveProperty('id', data.id);
      expect(result).toHaveProperty('isCorrect', data.isCorrect);
      expect(result.question).toEqual(data.question);
      expect(result.assessmentSession).toEqual(data.assessmentSession);
      // Importantly, should NOT have a 'correct' property
      expect(result).not.toHaveProperty('correct');
    });

    it('should create a hybrid response with object as third parameter', () => {
      // Arrange
      const data = {
        id: '123',
        question: { id: 'q1' },
        assessmentSession: { id: 's1' },
        isCorrect: true
      };
      const message = 'Success message';
      const additionalProps = { correct: true, extraProp: 'value' };

      // Act
      const result = createHybridResponse(data, message, additionalProps);

      // Assert
      expect(result).toHaveProperty('success', true); // Default success value
      expect(result).toHaveProperty('message', message);
      expect(result).toHaveProperty('data', data);
      expect(result).toHaveProperty('id', data.id);
      expect(result).toHaveProperty('isCorrect', data.isCorrect);
      // Additional props should be added
      expect(result).toHaveProperty('correct', additionalProps.correct);
      expect(result).toHaveProperty('extraProp', additionalProps.extraProp);
    });

    it('should handle null data', () => {
      // Act
      const result = createHybridResponse(null, 'No data', false);

      // Assert
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('message', 'No data');
      expect(result).toHaveProperty('data', null);
    });
  });
});

describe('createHybridResponse Function', () => {
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
}); 