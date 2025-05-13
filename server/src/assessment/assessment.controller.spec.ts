import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubmitAnswerDto } from '../dto/submit-answer.dto';
import { AssessmentResponseDto } from '../dto/assessment.dto';
import { User } from '../entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AssessmentOwnerGuard } from '../auth/assessment-owner.guard';
import { StudentGuard } from '../auth/student.guard';
import { Repository } from 'typeorm';
import { LegacyResponseInterceptor } from '../common/interceptors/legacy-response.interceptor';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AssessmentSession } from '../entities/assessment_session.entity';

// Mock for Repository
class MockRepository<T> {
  findOne = jest.fn();
  find = jest.fn();
  save = jest.fn();
  create = jest.fn();
}

describe('AssessmentController', () => {
  let controller: AssessmentController;
  let service: AssessmentService;

  // Mock response data
  const mockResult: AssessmentResponseDto = {
    id: 'test-id',
    userResponse: 'A',
    isCorrect: true,
    answeredAt: new Date(),
    assessmentSession: {
      id: 'session-id',
      status: 'in_progress'
    },
    question: {
      id: 'question-id',
      questionText: 'What is 2+2?',
      questionType: 'multiple_choice',
      options: { A: '4', B: '3', C: '5', D: '2' },
      difficultyLevel: 1
    }
  };

  // Mock user with required User properties
  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    passwordHash: 'hash',
    firstName: 'Test',
    lastName: 'User',
    role: 'student',
    gradeLevel: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  } as User;

  // Mock DTO
  const mockSubmitDto: SubmitAnswerDto = {
    assessmentSessionId: 'session-id',
    questionId: 'question-id',
    userResponse: 'A'
  };

  // Mock guards
  const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssessmentController],
      providers: [
        {
          provide: AssessmentService,
          useValue: {
            submitAnswer: jest.fn().mockResolvedValue(mockResult),
            startAssessment: jest.fn(),
            getNextQuestion: jest.fn(),
            getSessionResult: jest.fn(),
          },
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: LegacyResponseInterceptor,
          useValue: {
            intercept: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AssessmentSession),
          useClass: MockRepository,
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue(mockGuard)
    .overrideGuard(StudentGuard)
    .useValue(mockGuard)
    .overrideGuard(AssessmentOwnerGuard)
    .useValue(mockGuard)
    .compile();

    controller = module.get<AssessmentController>(AssessmentController);
    service = module.get<AssessmentService>(AssessmentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('submitAnswer', () => {
    it('should return a hybrid response with direct properties and wrapper format', async () => {
      // Act
      const response = await controller.submitAnswer(mockUser, mockSubmitDto);

      // Assert service was called correctly
      expect(service.submitAnswer).toHaveBeenCalledWith(
        mockUser.id,
        mockSubmitDto
      );

      // Verify hybrid response structure
      expect(response).toEqual(expect.objectContaining({
        // Wrapper properties
        success: true,
        message: 'Answer submitted correctly',
        data: mockResult,
        
        // Direct DTO properties
        id: mockResult.id,
        userResponse: mockResult.userResponse,
        isCorrect: mockResult.isCorrect,
        answeredAt: mockResult.answeredAt,
        
        // Backward compatibility property
        correct: mockResult.isCorrect
      }));
    });

    it('should set the correct message based on isCorrect value', async () => {
      // Setup incorrect answer result
      const incorrectResult = {
        ...mockResult,
        isCorrect: false,
      };
      
      // Mock service to return incorrect result
      jest.spyOn(service, 'submitAnswer').mockResolvedValueOnce(incorrectResult);
      
      // Act
      const response = await controller.submitAnswer(mockUser, mockSubmitDto);
      
      // Assert message is appropriate for incorrect answer
      expect(response.message).toBe('Answer submitted but incorrect');
      expect(response.correct).toBe(false);
    });
  });
}); 