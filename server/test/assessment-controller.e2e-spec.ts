import { Test } from '@nestjs/testing';
import { createHybridResponse } from '../src/common/utils/response-helper';
import { AssessmentController } from '../src/assessment/assessment.controller';
import { AssessmentService } from '../src/assessment/assessment.service';

jest.mock('../src/common/utils/response-helper', () => ({
  createHybridResponse: jest.fn().mockImplementation((data, message, successOrProps) => ({
    ...data,
    success: typeof successOrProps === 'boolean' ? successOrProps : true,
    message,
    data,
    ...(typeof successOrProps === 'object' ? successOrProps : {})
  }))
}));

describe('AssessmentController', () => {
  let controller: AssessmentController;
  let mockService: Partial<AssessmentService>;

  beforeEach(async () => {
    mockService = {
      submitAnswer: jest.fn().mockResolvedValue({
        id: 'response-id',
        isCorrect: true,
        assessmentSession: { id: 'session-id' },
        question: { id: 'question-id' }
      })
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [AssessmentController],
      providers: [{ provide: AssessmentService, useValue: mockService }]
    }).compile();

    controller = moduleRef.get<AssessmentController>(AssessmentController);
  });

  describe('submitAnswer', () => {
    it('should call createHybridResponse with boolean isCorrect value', async () => {
      // Arrange
      const submitDto = {
        assessmentSessionId: 'session-id',
        questionId: 'question-id',
        userResponse: 'A'
      };
      const mockUser = { id: 'user-id' };

      // Act
      await controller.submitAnswer(submitDto, mockUser as any);

      // Assert
      expect(createHybridResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'response-id',
          isCorrect: true
        }),
        'Answer submitted correctly',
        true // Very important: This must be a boolean, not an object!
      );
    });

    it('should use correct message when answer is incorrect', async () => {
      // Arrange
      const submitDto = {
        assessmentSessionId: 'session-id',
        questionId: 'question-id',
        userResponse: 'A'
      };
      const mockUser = { id: 'user-id' };

      // Override the mock to return an incorrect answer
      mockService.submitAnswer = jest.fn().mockResolvedValue({
        id: 'response-id',
        isCorrect: false,
        assessmentSession: { id: 'session-id' },
        question: { id: 'question-id' }
      });

      // Act
      await controller.submitAnswer(submitDto, mockUser as any);

      // Assert
      expect(createHybridResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'response-id',
          isCorrect: false
        }),
        'Answer submitted but incorrect',
        false // This should be the boolean value of isCorrect
      );
    });
  });
}); 