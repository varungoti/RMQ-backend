import { Test, TestingModule } from '@nestjs/testing';
import { MessagingController } from './messaging.controller';
import { AssessmentService } from '../assessment.service';
import { RmqContext } from '@nestjs/microservices';
import { ProcessAssessmentResponseDto } from './dto/process-assessment-response.dto';
import { FinishAssessmentSessionDto } from './dto/finish-assessment-session.dto';

describe('MessagingController', () => {
  let controller: MessagingController;
  let assessmentService: AssessmentService;

  const mockAssessmentService = {
    submitAnswer: jest.fn(),
    calculateOverallScore: jest.fn(),
  };

  const mockChannel = {
    ack: jest.fn(),
    reject: jest.fn(),
  };

  const mockContext = {
    getChannelRef: () => mockChannel,
    getMessage: () => ({ content: Buffer.from('test') }),
    getPattern: () => 'test-pattern',
    args: [],
    getArgs: () => [],
    getArgByIndex: () => undefined,
  } as unknown as RmqContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagingController],
      providers: [
        {
          provide: AssessmentService,
          useValue: mockAssessmentService,
        },
      ],
    }).compile();

    controller = module.get<MessagingController>(MessagingController);
    assessmentService = module.get<AssessmentService>(AssessmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processAssessmentResponse', () => {
    const validPayload: ProcessAssessmentResponseDto = {
      userId: 'user123',
      assessmentSessionId: 'session456',
      questionId: 'question789',
      userResponse: 'Option A',
    };

    it('should successfully process assessment response', async () => {
      const expectedResult = {
        success: true,
        message: 'Answer submitted successfully',
      };

      mockAssessmentService.submitAnswer.mockResolvedValue(expectedResult);

      const result = await controller.processAssessmentResponse(
        validPayload,
        mockContext,
      );

      expect(result).toEqual({
        success: true,
        message: 'Assessment response processed successfully',
        ...expectedResult,
      });
      expect(mockChannel.ack).toHaveBeenCalled();
      expect(mockChannel.reject).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const validationError = {
        name: 'ValidationError',
        message: 'Invalid input',
      };

      mockAssessmentService.submitAnswer.mockRejectedValue(validationError);

      const result = await controller.processAssessmentResponse(
        validPayload,
        mockContext,
      );

      expect(result).toEqual({
        success: false,
        message: 'Invalid input',
        error: {
          code: 'ValidationError',
          details: 'Invalid input',
        },
      });
      expect(mockChannel.ack).toHaveBeenCalled();
      expect(mockChannel.reject).not.toHaveBeenCalled();
    });

    it('should handle business errors', async () => {
      const businessError = new Error('Business rule violation');
      businessError.name = 'BusinessError';

      mockAssessmentService.submitAnswer.mockRejectedValue(businessError);

      const result = await controller.processAssessmentResponse(
        validPayload,
        mockContext,
      );

      expect(result).toEqual({
        success: false,
        message: 'Business rule violation',
        error: {
          code: 'BusinessError',
          details: 'Business rule violation',
        },
      });
      expect(mockChannel.ack).toHaveBeenCalled();
      expect(mockChannel.reject).not.toHaveBeenCalled();
    });

    it('should handle transient errors with retry', async () => {
      const transientError = new Error('Database connection failed');
      transientError.name = 'DatabaseError';

      mockAssessmentService.submitAnswer.mockRejectedValue(transientError);

      const result = await controller.processAssessmentResponse(
        validPayload,
        mockContext,
      );

      expect(result).toEqual({
        success: false,
        message: 'Error processing assessment response',
        error: {
          code: 'PROCESSING_ERROR',
          details: 'Database connection failed',
        },
      });
      expect(mockChannel.ack).not.toHaveBeenCalled();
      expect(mockChannel.reject).toHaveBeenCalledWith(expect.any(Object), true);
    });
  });

  describe('finishAssessmentSession', () => {
    const validPayload: FinishAssessmentSessionDto = {
      userId: 'user123',
      assessmentSessionId: 'session456',
    };

    it('should successfully finish assessment session', async () => {
      const expectedResult = {
        score: 85,
        level: 3,
      };

      mockAssessmentService.calculateOverallScore.mockResolvedValue(expectedResult);

      const result = await controller.finishAssessmentSession(
        validPayload,
        mockContext,
      );

      expect(result).toEqual({
        success: true,
        assessmentSessionId: validPayload.assessmentSessionId,
        score: expectedResult.score,
        level: expectedResult.level,
      });
      expect(mockChannel.ack).toHaveBeenCalled();
      expect(mockChannel.reject).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const validationError = {
        name: 'ValidationError',
        message: 'Invalid session ID',
      };

      mockAssessmentService.calculateOverallScore.mockRejectedValue(validationError);

      const result = await controller.finishAssessmentSession(
        validPayload,
        mockContext,
      );

      expect(result).toEqual({
        success: false,
        message: 'Invalid session ID',
        error: {
          code: 'ValidationError',
          details: 'Invalid session ID',
        },
      });
      expect(mockChannel.ack).toHaveBeenCalled();
      expect(mockChannel.reject).not.toHaveBeenCalled();
    });

    it('should handle business errors', async () => {
      const businessError = new Error('Session already completed');
      businessError.name = 'BusinessError';

      mockAssessmentService.calculateOverallScore.mockRejectedValue(businessError);

      const result = await controller.finishAssessmentSession(
        validPayload,
        mockContext,
      );

      expect(result).toEqual({
        success: false,
        message: 'Session already completed',
        error: {
          code: 'BusinessError',
          details: 'Session already completed',
        },
      });
      expect(mockChannel.ack).toHaveBeenCalled();
      expect(mockChannel.reject).not.toHaveBeenCalled();
    });

    it('should handle transient errors with retry', async () => {
      const transientError = new Error('Database connection failed');
      transientError.name = 'DatabaseError';

      mockAssessmentService.calculateOverallScore.mockRejectedValue(transientError);

      const result = await controller.finishAssessmentSession(
        validPayload,
        mockContext,
      );

      expect(result).toEqual({
        success: false,
        message: 'Error finishing assessment session',
        error: {
          code: 'PROCESSING_ERROR',
          details: 'Database connection failed',
        },
      });
      expect(mockChannel.ack).not.toHaveBeenCalled();
      expect(mockChannel.reject).toHaveBeenCalledWith(expect.any(Object), true);
    });
  });
}); 