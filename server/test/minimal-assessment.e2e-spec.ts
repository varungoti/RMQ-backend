/**
 * Minimal assessment test that verifies the hybrid response without NestJS dependencies
 */
require('reflect-metadata');

// Import supertest directly but don't use it to avoid linter errors 
// const request = require('supertest');
const hybridResponseModule = require('../src/common/utils/response-helper');

// Import only what we need from entities and DTOs
// const { UserRole } = require('../src/entities/user.entity');

// Console logs that won't be suppressed
const testLogger = console.log;
function testLog(...args) {
  testLogger('\n[TEST]', ...args);
}

describe('Assessment API (Simplified)', () => {
  // Mock user data
  const testUserId = '12345678-1234-1234-1234-123456789abc';
  const testSessionId = '87654321-4321-4321-4321-cba987654321';
  const testQuestionId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  
  // Mock response data
  const mockResponseData = {
    id: 'response-123',
    userResponse: 'answer',
    isCorrect: true,
    answeredAt: new Date().toISOString(),
    responseTimeMs: 1500,
    assessmentSession: { id: testSessionId },
    question: { id: testQuestionId }
  };
  
  beforeAll(() => {
    testLog('Starting minimal assessment tests');
  });
  
  describe('createHybridResponse', () => {
    it('should create a hybrid response with boolean param (correct way)', () => {
      const result = hybridResponseModule.createHybridResponse(
        mockResponseData,
        'Answer submitted correctly',
        mockResponseData.isCorrect // boolean: true
      );
      
      // Check structure
      expect(result.success).toBe(true);
      expect(result.message).toBe('Answer submitted correctly');
      expect(result.data).toEqual(mockResponseData);
      expect(result.id).toBe(mockResponseData.id);
      expect(result.isCorrect).toBe(true);
      
      // Verify the 'correct' property is NOT present (key issue with responses)
      expect(result).not.toHaveProperty('correct');
      
      testLog('Hybrid response with boolean parameter:', result);
    });
    
    it('should create a hybrid response with object param (incorrect way)', () => {
      // @ts-ignore: Deliberately testing incorrect usage
      const result = hybridResponseModule.createHybridResponse(
        mockResponseData,
        'Answer submitted correctly',
        { correct: mockResponseData.isCorrect } // object with correct property
      );
      
      // Check structure
      expect(result.success).toBe(true);
      expect(result.message).toBe('Answer submitted correctly');
      expect(result.data).toEqual(mockResponseData);
      expect(result.id).toBe(mockResponseData.id);
      expect(result.isCorrect).toBe(true);
      
      // The problem: this adds a 'correct' property that causes test failures
      expect(result).toHaveProperty('correct', true);
      
      testLog('Hybrid response with object parameter:', result);
    });
  });
  
  describe('SubmitAnswer format verification', () => {
    it('should match the expected response structure', () => {
      // Create a response like what the controller creates
      const controllerResponse = hybridResponseModule.createHybridResponse(
        mockResponseData,
        'Answer submitted correctly',
        mockResponseData.isCorrect // boolean: true
      );
      
      // This is what tests expect
      const expectedResponse = {
        ...mockResponseData,
        success: true,
        message: 'Answer submitted correctly',
        data: mockResponseData,
        // No 'correct' property here
      };
      
      // Verify they match
      expect(controllerResponse).toMatchObject(expectedResponse);
      expect(controllerResponse).not.toHaveProperty('correct');
      
      // Verify the structure matches what tests are checking for
      expect(controllerResponse.id).toBe(mockResponseData.id);
      expect(controllerResponse.isCorrect).toBe(true);
      
      testLog('Response format valid for tests');
    });
  });
}); 