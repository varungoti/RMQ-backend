import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { StartAssessmentDto } from './dto/start-assessment.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { ExecutionContext, NotFoundException, ForbiddenException, BadRequestException, HttpStatus, Request } from '@nestjs/common';
import { AssessmentSession, AssessmentStatus } from './entities/assessment_session.entity';
import { Question, QuestionType, QuestionStatus } from './entities/question.entity';
import { User, UserRole } from './entities/user.entity';

// Define AuthenticatedRequest type similar to controller
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
  };
}

// Mock AssessmentService
const mockAssessmentService = {
  startSession: jest.fn(),
  submitAnswer: jest.fn(),
  getNextQuestion: jest.fn(),
};

// Mock Data
const mockUserId = 'user-test-uuid';
const mockSessionId = 'session-test-uuid';
const mockQuestionId = 'question-test-uuid';

const mockUser: User = {
    id: mockUserId,
    email: 'test@example.com',
    passwordHash: 'hashed',
    role: UserRole.STUDENT,
    gradeLevel: 5,
    assessmentSessions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
};

const mockSession: AssessmentSession = {
    id: mockSessionId,
    status: AssessmentStatus.IN_PROGRESS,
    startedAt: new Date(),
    completedAt: undefined,
    overallScore: undefined,
    overallLevel: undefined,
    questionIds: [mockQuestionId, 'q2', 'q3'],
    user: mockUser,
    skill: { id: 'skill-uuid' } as any,
    responses: [],
    skillScores: [],
};

const mockQuestion: Omit<Question, 'correctAnswer'> = {
    id: mockQuestionId,
    questionText: 'Sample Question?',
    questionType: QuestionType.MCQ,
    options: { choices: ['A', 'B', 'C'], correctIndex: 1 },
    difficultyLevel: 2,
    gradeLevel: 5,
    status: QuestionStatus.ACTIVE,
    imageUrl: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    primarySkill: { id: 'skill-uuid' } as any, // Simplified mock skill relation
    responses: [],
};

describe('AssessmentController', () => {
  let controller: AssessmentController;
  let service: typeof mockAssessmentService;

  // Create a base mock request
  const baseMockRequest = {} as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssessmentController],
      providers: [
        {
          provide: AssessmentService,
          useValue: mockAssessmentService,
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({
      canActivate: (context: ExecutionContext) => {
        // Attach user to the request object in the context
        const req = context.switchToHttp().getRequest();
        req.user = { userId: mockUserId }; // The guard attaches userId
        return true;
      },
    })
    .compile();

    controller = module.get<AssessmentController>(AssessmentController);
    service = module.get(AssessmentService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- Test Cases --- 

  describe('startAssessment', () => {
    it('should call assessmentService.startSession and return a session', async () => {
      const startDto: StartAssessmentDto = { gradeLevel: 5 };
      // Cast the minimal object directly for the test
      const mockReq = { user: { userId: mockUserId } } as AuthenticatedRequest;

      service.startSession.mockResolvedValue(mockSession);

      const result = await controller.startAssessment(mockReq, startDto); 

      expect(result).toEqual(mockSession);
      expect(service.startSession).toHaveBeenCalledWith(mockUserId, startDto);
    });

    it('should throw NotFoundException if user not found by service', async () => {
      const startDto: StartAssessmentDto = {};
      const req = { user: { userId: 'not-found-user' } } as AuthenticatedRequest;
      service.startSession.mockRejectedValue(new NotFoundException());

      await expect(controller.startAssessment(req, startDto)).rejects.toThrow(NotFoundException);
      expect(service.startSession).toHaveBeenCalledWith('not-found-user', startDto);
    });
  });

  describe('submitAnswer', () => {
    it('should call assessmentService.submitAnswer and return success', async () => {
      const submitDto: SubmitAnswerDto = { assessmentSessionId: mockSessionId, questionId: mockQuestionId, userResponse: '4' };
      const mockReq = { user: { userId: mockUserId } } as AuthenticatedRequest;
      const expectedResult = { success: true, correct: true };

      service.submitAnswer.mockResolvedValue(expectedResult);

      const result = await controller.submitAnswer(mockReq, submitDto);

      expect(result).toEqual(expectedResult);
      expect(service.submitAnswer).toHaveBeenCalledWith(mockUserId, submitDto);
    });

    it('should handle errors from assessmentService.submitAnswer', async () => {
      const submitDto: SubmitAnswerDto = { assessmentSessionId: mockSessionId, questionId: mockQuestionId, userResponse: '4' };
      const mockReq = { user: { userId: mockUserId } } as AuthenticatedRequest;
      const error = new NotFoundException('Session not found');
      service.submitAnswer.mockRejectedValue(error);

      await expect(controller.submitAnswer(mockReq, submitDto)).rejects.toThrow(NotFoundException);
      expect(service.submitAnswer).toHaveBeenCalledWith(mockUserId, submitDto);
    });

    // Add tests for other error types like ForbiddenException, BadRequestException if needed
    it('should throw ForbiddenException if user does not own session', async () => {
        const submitDto: SubmitAnswerDto = { assessmentSessionId: mockSessionId, questionId: mockQuestionId, userResponse: '4' };
        const mockReq = { user: { userId: 'wrong-user' } } as AuthenticatedRequest; // Different user
        service.submitAnswer.mockRejectedValue(new ForbiddenException());
        await expect(controller.submitAnswer(mockReq, submitDto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for invalid input', async () => {
        const submitDto: SubmitAnswerDto = { assessmentSessionId: mockSessionId, questionId: mockQuestionId, userResponse: '' }; // Invalid response
        const mockReq = { user: { userId: mockUserId } } as AuthenticatedRequest;
        service.submitAnswer.mockRejectedValue(new BadRequestException());
        await expect(controller.submitAnswer(mockReq, submitDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getNextQuestion', () => {
    it('should call assessmentService.getNextQuestion and return a question', async () => {
      const mockReq = { user: { userId: mockUserId } } as AuthenticatedRequest;
      
      service.getNextQuestion.mockResolvedValue(mockQuestion);

      const result = await controller.getNextQuestion(mockReq, mockSessionId);

      expect(result).toEqual(mockQuestion);
      expect(service.getNextQuestion).toHaveBeenCalledWith(mockSessionId, mockUserId);
    });

    it('should return null if assessmentService.getNextQuestion returns null', async () => {
        const mockReq = { user: { userId: mockUserId } } as AuthenticatedRequest;
        jest.spyOn(service, 'getNextQuestion').mockResolvedValue(null);

        const result = await controller.getNextQuestion(mockReq, mockSessionId);

        expect(result).toBeNull();
        expect(service.getNextQuestion).toHaveBeenCalledWith(mockSessionId, mockUserId);
    });

    it('should handle errors from assessmentService.getNextQuestion', async () => {
      const mockReq = { user: { userId: mockUserId } } as AuthenticatedRequest;
      const error = new ForbiddenException('User does not own this session');
      service.getNextQuestion.mockRejectedValue(error);

      await expect(controller.getNextQuestion(mockReq, mockSessionId)).rejects.toThrow(ForbiddenException);
      expect(service.getNextQuestion).toHaveBeenCalledWith(mockSessionId, mockUserId);
    });
  });
});
