import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentService } from './assessment.service';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AssessmentSession, AssessmentStatus } from './entities/assessment_session.entity';
import { AssessmentResponse } from './entities/assessment_response.entity';
import { AssessmentSkillScore } from './entities/assessment_skill_score.entity';
import { Question, QuestionType, QuestionStatus } from './entities/question.entity';
import { User, UserRole } from './entities/user.entity';
import { Skill, SkillStatus } from './entities/skill.entity';
import { Repository, EntityNotFoundError } from 'typeorm';
import { BadRequestException, ForbiddenException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { StartAssessmentDto } from './dto/start-assessment.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { GetNextQuestionResponseDto, QuestionPublicDto } from './dto/assessment.dto';

// Define Mock Repository Type (Adjust ObjectLiteral if needed based on TypeORM version)
type MockRepository<T extends Record<string, any> = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

// Factory function for creating mocks
const createMockRepository = <T extends Record<string, any> = any>(): MockRepository<T> => ({
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  findOneOrFail: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  countBy: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  })),
  // Add other repository methods used by the service if needed
});

// --- Mock Data ---
const mockUserId = 'user-uuid-123';
const mockSessionId = 'session-uuid-456';
const mockQuestionId1 = 'question-uuid-001';
const mockQuestionId2 = 'question-uuid-002';
const mockSkillId = 'skill-uuid-789';

const mockUser: User = {
  id: mockUserId,
  email: 'test@example.com',
  passwordHash: 'hashedpassword',
  role: UserRole.STUDENT,
  gradeLevel: 8,
  createdAt: new Date(),
  updatedAt: new Date(),
  assessmentSessions: [],
};

const mockSkill: Skill = {
  id: mockSkillId,
  name: 'Algebra Basics',
  subject: 'Math',
  description: 'Fundamental concepts of algebra',
  gradeLevel: 8,
  status: SkillStatus.ACTIVE,
  isPrimary: true,
  isSecondary: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  questions: [],
  skillScores: [],
  primarySkills: [],
  secondarySkills: [],
  //tertiarySkills: [],
};

const mockQuestion1: Question = {
  id: mockQuestionId1,
  questionText: 'Solve for x: 2x + 3 = 7',
  questionType: QuestionType.MCQ,
  options: { choices: ['1', '2', '3', '4'], correctIndex: 1 },
  correctAnswer: '2',
  difficultyLevel: 2,
  gradeLevel: 8,
  imageUrl: undefined,
  status: QuestionStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
  primarySkill: mockSkill,
  responses: [],
};

const mockQuestion2: Question = {
    id: mockQuestionId2,
    questionText: 'What is 5 * 3?',
    questionType: QuestionType.MCQ,
    options: { choices: ['10', '15', '20', '25'], correctIndex: 1 },
    correctAnswer: '15',
    primarySkill: mockSkill,
    gradeLevel: 8,
    difficultyLevel: 1,
    imageUrl: undefined,
    status: QuestionStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    responses: [],
};

const mockSessionInProgress: AssessmentSession = {
  id: mockSessionId,
  status: AssessmentStatus.IN_PROGRESS,
  startedAt: new Date(),
  completedAt: null, 
  overallScore: 0, // Overall score if tracked
  questionIds: [mockQuestionId1, mockQuestionId2],
  user: mockUser,
  skill: mockSkill,
  responses: [],
  skillScores: [],
};

// --- End Mock Data ---

describe('AssessmentService', () => {
  let service: AssessmentService;
  let mockSessionsRepository: MockRepository<AssessmentSession>;
  let mockResponsesRepository: MockRepository<AssessmentResponse>;
  let mockSkillsRepository: MockRepository<Skill>;
  let mockQuestionsRepository: MockRepository<Question>;
  let mockSkillScoresRepository: MockRepository<AssessmentSkillScore>;
  let mockUsersRepository: MockRepository<User>;

  beforeEach(async () => {
    // Instantiate mocks before each test
    mockSessionsRepository = createMockRepository<AssessmentSession>();
    mockResponsesRepository = createMockRepository<AssessmentResponse>();
    mockSkillsRepository = createMockRepository<Skill>();
    mockQuestionsRepository = createMockRepository<Question>();
    mockSkillScoresRepository = createMockRepository<AssessmentSkillScore>();
    mockUsersRepository = createMockRepository<User>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentService,
        { provide: getRepositoryToken(AssessmentSession), useValue: mockSessionsRepository },
        { provide: getRepositoryToken(AssessmentResponse), useValue: mockResponsesRepository },
        { provide: getRepositoryToken(AssessmentSkillScore), useValue: mockSkillScoresRepository },
        { provide: getRepositoryToken(Question), useValue: mockQuestionsRepository },
        { provide: getRepositoryToken(User), useValue: mockUsersRepository },
        { provide: getRepositoryToken(Skill), useValue: mockSkillsRepository },
      ],
    }).compile();

    service = module.get<AssessmentService>(AssessmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Tests for startSession --- 
  describe('startSession', () => {
    // DTO only has optional gradeLevel
    const startDto: StartAssessmentDto = {
      gradeLevel: 8,
    };

    beforeEach(() => {
      // Reset mocks for startSession tests
      mockUsersRepository.findOneBy.mockReset();
      mockQuestionsRepository.createQueryBuilder.mockReset();
      mockSessionsRepository.create.mockReset();
      mockSessionsRepository.save.mockReset();
      mockSkillScoresRepository.create.mockReset();
      mockSkillScoresRepository.save.mockReset();
      // Reset query builder mocks if necessary
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(), // Added for skill relation
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };
      mockQuestionsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('should create and save a new assessment session', async () => {
      // Arrange
      mockUsersRepository.findOneBy.mockResolvedValue(mockUser); // Found user
      // Mock question selection - return 2 questions
      const questions = [
        mockQuestion1, 
        mockQuestion2
      ];
      // Mock the getMany() part of the query builder
      mockQuestionsRepository.createQueryBuilder().getMany.mockResolvedValue(questions);

      const createdSession = {
        id: 'new-session-uuid',
        user: mockUser,
        status: AssessmentStatus.IN_PROGRESS,
        startedAt: expect.any(Date),
        questionIds: [mockQuestionId1, mockQuestionId2],
        skill: mockSkill,
        skillScores: [],
        responses: [],
        completedAt: null,
        overallScore: 0,
      };
      mockSessionsRepository.create.mockReturnValue(createdSession);
      mockSessionsRepository.save.mockResolvedValue(createdSession); // Simulate session save
      
      // Act - Pass userId and dto separately
      const result = await service.startSession(mockUserId, startDto);

      // Assert
      expect(mockUsersRepository.findOneBy).toHaveBeenCalledWith({ id: mockUserId });
      expect(mockQuestionsRepository.createQueryBuilder).toHaveBeenCalled();
      const qb = mockQuestionsRepository.createQueryBuilder();
      // expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('question.primarySkill', 'skill'); // Commented out: startSession doesn't join skill here
      expect(qb.where).toHaveBeenCalledWith(expect.stringContaining('question.gradeLevel = :gradeLevel'), { gradeLevel: startDto.gradeLevel });
      expect(qb.orderBy).toHaveBeenCalled(); 
      expect(qb.take).toHaveBeenCalledWith(10); // Check against the default number of questions (10)
      expect(qb.getMany).toHaveBeenCalled();
      
      expect(mockSessionsRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        user: mockUser,
        status: AssessmentStatus.IN_PROGRESS,
        questionIds: [mockQuestionId1, mockQuestionId2],
      }));
      expect(mockSessionsRepository.save).toHaveBeenCalledWith(createdSession);
      
      expect(result).toEqual(expect.objectContaining({ id: 'new-session-uuid', questionIds: [mockQuestionId1, mockQuestionId2] }));
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUsersRepository.findOneBy.mockResolvedValue(null); // User not found

      await expect(service.startSession(mockUserId, startDto)).rejects.toThrow(NotFoundException);
      expect(mockUsersRepository.findOneBy).toHaveBeenCalledWith({ id: mockUserId });
      expect(mockQuestionsRepository.createQueryBuilder().getMany).not.toHaveBeenCalled();
      expect(mockSessionsRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if not enough questions are found', async () => {
      mockUsersRepository.findOneBy.mockResolvedValue(mockUser);
      // Fix: Mock getMany to return an empty array to trigger the BadRequestException
      mockQuestionsRepository.createQueryBuilder().getMany.mockResolvedValue([]); 

      await expect(service.startSession(mockUserId, startDto)).rejects.toThrow(BadRequestException);
      expect(mockQuestionsRepository.createQueryBuilder().getMany).toHaveBeenCalled();
      expect(mockSessionsRepository.save).not.toHaveBeenCalled();
    });

    it('should use user gradeLevel if dto gradeLevel is not provided', async () => {
       const dtoWithoutGrade: StartAssessmentDto = {}; // Empty DTO
       mockUsersRepository.findOneBy.mockResolvedValue(mockUser); // User has gradeLevel 8
       mockQuestionsRepository.createQueryBuilder().getMany.mockResolvedValue([mockQuestion1, mockQuestion2]);
       mockSessionsRepository.create.mockReturnValue({ id: 'sid' });
       mockSessionsRepository.save.mockResolvedValue({ id: 'sid' });
       mockSkillScoresRepository.create.mockReturnValue({});
       mockSkillScoresRepository.save.mockResolvedValue({});

       await service.startSession(mockUserId, dtoWithoutGrade);

       const qb = mockQuestionsRepository.createQueryBuilder();
       // Check that the user's grade level was used in the query
       expect(qb.where).toHaveBeenCalledWith(expect.stringContaining('question.gradeLevel = :gradeLevel'), { gradeLevel: mockUser.gradeLevel });
    });

  });

  // --- Tests for submitAnswer ---
  describe('submitAnswer', () => {
      const submitDto: SubmitAnswerDto = {
          assessmentSessionId: mockSessionId,
          questionId: mockQuestionId1,
          userResponse: '2', // Correct answer for mockQuestion1
      };

      // Reset mocks before each submitAnswer test
      beforeEach(() => {
          mockSessionsRepository.findOne.mockReset();
          mockQuestionsRepository.findOneBy.mockReset();
          mockQuestionsRepository.findOne.mockReset(); // Used for skill relation
          mockResponsesRepository.findOneBy.mockReset();
          mockResponsesRepository.create.mockReset();
          mockResponsesRepository.save.mockReset();
          mockResponsesRepository.countBy.mockReset();
          mockSkillScoresRepository.findOneBy.mockReset();
          mockSkillScoresRepository.create.mockReset();
          mockSkillScoresRepository.save.mockReset();
          mockSessionsRepository.save.mockReset(); // For completion update
      });

      it('should successfully submit a correct answer, create score, and not complete session', async () => {
          // Arrange
          mockSessionsRepository.findOne.mockResolvedValue(mockSessionInProgress); // Find session
          mockQuestionsRepository.findOneBy.mockResolvedValue(mockQuestion1); // Find question
          mockResponsesRepository.findOneBy.mockResolvedValue(null); // No existing response
          mockQuestionsRepository.findOne.mockResolvedValue(mockQuestion1); // Find question w/ skill
          mockSkillScoresRepository.findOneBy.mockResolvedValue(null); // No existing skill score
          mockResponsesRepository.countBy.mockResolvedValue(0); // No previous responses

          const createdResponse = { ...submitDto, id: 'response-1', isCorrect: true };
          mockResponsesRepository.create.mockReturnValue(createdResponse); // Mock response creation
          // mockResponsesRepository.save is called, assume success
          
          const createdScore = { assessmentSession: mockSessionInProgress, skill: mockSkill, score: 500 + 16, questionsAttempted: 1 }; // 500 + 32*(1-0.5)
          mockSkillScoresRepository.create.mockReturnValue(createdScore);
          // mockSkillScoresRepository.save is called, assume success

          // Act
          const result = await service.submitAnswer(mockUserId, submitDto);

          // Assert
          expect(result).toEqual({ success: true, correct: true });
          expect(mockSessionsRepository.findOne).toHaveBeenCalledWith({ where: { id: mockSessionId }, relations: ['user'] });
          expect(mockQuestionsRepository.findOneBy).toHaveBeenCalledWith({ id: mockQuestionId1 });
          expect(mockResponsesRepository.findOneBy).toHaveBeenCalledWith({ assessmentSession: { id: mockSessionId }, question: { id: mockQuestionId1 } });
          expect(mockResponsesRepository.create).toHaveBeenCalledWith(expect.objectContaining({ assessmentSession: mockSessionInProgress, question: mockQuestion1, userResponse: '2', isCorrect: true }));
          expect(mockResponsesRepository.save).toHaveBeenCalledWith(createdResponse);
          expect(mockQuestionsRepository.findOne).toHaveBeenCalledWith({ where: { id: mockQuestionId1 }, relations: ['primarySkill'] }); // For score update
          expect(mockSkillScoresRepository.findOneBy).toHaveBeenCalledWith({ assessmentSession: { id: mockSessionId }, skill: { id: mockSkillId } });
          expect(mockSkillScoresRepository.create).toHaveBeenCalledWith(expect.objectContaining({ score: 516, questionsAttempted: 1 }));
          expect(mockSkillScoresRepository.save).toHaveBeenCalledWith(createdScore);
          expect(mockResponsesRepository.countBy).toHaveBeenCalledWith({ assessmentSession: { id: mockSessionId } });
          expect(mockSessionsRepository.save).not.toHaveBeenCalled(); // Session not completed yet
      });
      
      // Add more tests for other submitAnswer scenarios (incorrect, update score, completion, errors...)
      // Example: Test session completion
      it('should mark session as completed on last answer', async () => {
            // Arrange
            const lastQuestionDto: SubmitAnswerDto = { ...submitDto, questionId: mockQuestionId2, userResponse: '15' };
            const sessionWithOneResponse = { 
                ...mockSessionInProgress, 
            };
            mockSessionsRepository.findOne.mockResolvedValue(sessionWithOneResponse);
            mockQuestionsRepository.findOneBy.mockResolvedValue(mockQuestion2);
            mockResponsesRepository.findOneBy.mockResolvedValue(null); 
            mockQuestionsRepository.findOne.mockResolvedValue(mockQuestion2); 
            mockSkillScoresRepository.findOneBy.mockResolvedValue(null); // Assume new score creation
            mockResponsesRepository.countBy.mockResolvedValue(2); // Correct: Simulate count AFTER the 2nd answer is saved
            mockResponsesRepository.create.mockReturnValue({ id: 'res-2' });
            mockSkillScoresRepository.create.mockReturnValue({ id: 'score-2' });

            // Act
            await service.submitAnswer(mockUserId, lastQuestionDto);

            // Assert
            expect(mockResponsesRepository.countBy).toHaveBeenCalledWith({ assessmentSession: { id: mockSessionId } });
            expect(mockSessionsRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                id: mockSessionId,
                status: AssessmentStatus.COMPLETED,
                completedAt: expect.any(Date)
            }));
      });

      // Example: Test Forbidden error if session not in progress
      it('should throw ForbiddenException if session is not IN_PROGRESS', async () => {
            const completedSession = { ...mockSessionInProgress, status: AssessmentStatus.COMPLETED };
            mockSessionsRepository.findOne.mockResolvedValue(completedSession);

            await expect(service.submitAnswer(mockUserId, submitDto)).rejects.toThrow(ForbiddenException);
            expect(mockQuestionsRepository.findOneBy).not.toHaveBeenCalled(); // Should fail before checking question
      });
      
      // Example: Test BadRequest error if answer already submitted
      it('should throw BadRequestException if question already answered', async () => {
            mockSessionsRepository.findOne.mockResolvedValue(mockSessionInProgress);
            mockQuestionsRepository.findOneBy.mockResolvedValue(mockQuestion1);
            mockResponsesRepository.findOneBy.mockResolvedValue({ id: 'prev-res-id' }); // Simulate existing response

            await expect(service.submitAnswer(mockUserId, submitDto)).rejects.toThrow(BadRequestException);
            expect(mockResponsesRepository.create).not.toHaveBeenCalled(); // Should fail before creating response
      });

  });

  // --- Tests for getNextQuestion --- 
  describe('getNextQuestion', () => {
    let mockSessionWithResponses: AssessmentSession;

    beforeEach(() => {
      // Reset mocks
      mockSessionsRepository.findOne.mockReset();
      mockResponsesRepository.find.mockReset();
      mockQuestionsRepository.findOne.mockReset();

      // Setup a session with some responses for general use
      mockSessionWithResponses = {
        ...mockSessionInProgress, // Start with the base session
        responses: [
          { 
            id: 'response-uuid-1', 
            assessmentSession: mockSessionInProgress, // Link back
            question: mockQuestion1, 
            userResponse: '2', 
            isCorrect: true, 
            answeredAt: new Date(),
          } as AssessmentResponse, // Cast to satisfy type
        ],
      };
    });

    it('should return the next unanswered question', async () => {
      // Arrange: Session in progress, user owns it, one answer submitted
      mockSessionsRepository.findOne.mockResolvedValue(mockSessionWithResponses);
      // Mock responses repo to return the first answer
      mockResponsesRepository.find.mockResolvedValue(mockSessionWithResponses.responses);
      // Mock questions repo to return the second question (mockQuestion2)
      mockQuestionsRepository.findOne.mockResolvedValue(mockQuestion2);

      // Expected Public DTO for Question 2
      const expectedNextQuestionDto: QuestionPublicDto = {
        id: mockQuestion2.id,
        text: mockQuestion2.questionText,
        type: mockQuestion2.questionType,
        options: (mockQuestion2.options ? Object.values(mockQuestion2.options) : []) as string[],
        skill: mockQuestion2.primarySkill,
        difficulty: mockQuestion2.difficultyLevel ?? 500, // Use the correct property and fallback
      };

      // Act
      const result = await service.getNextQuestion(mockSessionId, mockUserId);

      // Assert
      expect(mockSessionsRepository.findOne).toHaveBeenCalledWith({ where: { id: mockSessionId }, relations: ['user'] });
      expect(mockResponsesRepository.find).toHaveBeenCalledWith({ 
        where: { assessmentSession: { id: mockSessionId } },
        relations: ['question'],
        select: { id: true, question: { id: true } },
      });
      // It should try to find the next ID (mockQuestionId2)
      expect(mockQuestionsRepository.findOne).toHaveBeenCalledWith({ 
          where: { id: mockQuestionId2 }, 
          relations: ['primarySkill'] 
      }); 
      // Check the overall response structure
      expect(result).toEqual<GetNextQuestionResponseDto>({
        isComplete: false,
        nextQuestion: expectedNextQuestionDto,
      });
      // Explicitly check that correctAnswer is not present
      expect(result.nextQuestion).not.toHaveProperty('correctAnswer');
    });

    it('should return isComplete true if all questions are answered', async () => {
      // Arrange: Session in progress, user owns it, ALL answers submitted
      const mockSessionCompleted = {
        ...mockSessionWithResponses, 
        responses: [
          { question: mockQuestion1 } as AssessmentResponse, // Simplified mock response
          { question: mockQuestion2 } as AssessmentResponse, // Simplified mock response
        ],
      };
      mockSessionsRepository.findOne.mockResolvedValue(mockSessionCompleted);
      // Mock responses repo to return answers for both questions
      mockResponsesRepository.find.mockResolvedValue(mockSessionCompleted.responses);
      // Mock session save when marking as complete
      mockSessionsRepository.save.mockResolvedValue({...mockSessionCompleted, status: AssessmentStatus.COMPLETED});

      // Act
      const result = await service.getNextQuestion(mockSessionId, mockUserId);

      // Assert
      expect(mockSessionsRepository.findOne).toHaveBeenCalledWith({ where: { id: mockSessionId }, relations: ['user'] });
      expect(mockResponsesRepository.find).toHaveBeenCalledWith({ 
        where: { assessmentSession: { id: mockSessionId } },
        relations: ['question'],
        select: { id: true, question: { id: true } },
      });
      // questionsRepository.findOne should NOT be called as no next ID is found
      expect(mockQuestionsRepository.findOne).not.toHaveBeenCalled();
      // Session save should be called to mark complete
      expect(mockSessionsRepository.save).toHaveBeenCalledWith(expect.objectContaining({ id: mockSessionId, status: AssessmentStatus.COMPLETED }));
      // Check the response structure
      expect(result).toEqual<GetNextQuestionResponseDto>({
        isComplete: true,
        nextQuestion: null,
      });
    });

    it('should return isComplete true if session status is not IN_PROGRESS', async () => {
        // Arrange: Session exists but is already COMPLETED
        const completedSession = { ...mockSessionInProgress, status: AssessmentStatus.COMPLETED };
        mockSessionsRepository.findOne.mockResolvedValue(completedSession);
  
        // Act
        const result = await service.getNextQuestion(mockSessionId, mockUserId);
  
        // Assert
        expect(mockSessionsRepository.findOne).toHaveBeenCalledWith({ where: { id: mockSessionId }, relations: ['user'] });
        // Other repos should not be called
        expect(mockResponsesRepository.find).not.toHaveBeenCalled();
        expect(mockQuestionsRepository.findOne).not.toHaveBeenCalled();
        expect(mockSessionsRepository.save).not.toHaveBeenCalled(); // Should not try to save again
        // Check response
        expect(result).toEqual<GetNextQuestionResponseDto>({
          isComplete: true,
          nextQuestion: null,
        });
      });

    it('should throw NotFoundException if session not found', async () => {
      mockSessionsRepository.findOne.mockResolvedValue(null); // Session not found

      await expect(service.getNextQuestion(mockSessionId, mockUserId)).rejects.toThrow(NotFoundException);
      expect(mockSessionsRepository.findOne).toHaveBeenCalledWith({ where: { id: mockSessionId }, relations: ['user'] });
    });

    it('should throw ForbiddenException if user does not own session', async () => {
      const wrongUser = { ...mockUser, id: 'wrong-user-id' };
      const sessionOwnedByOther = { ...mockSessionInProgress, user: wrongUser }; 
      mockSessionsRepository.findOne.mockResolvedValue(sessionOwnedByOther); // Session found, but wrong user

      await expect(service.getNextQuestion(mockSessionId, mockUserId)).rejects.toThrow(ForbiddenException);
      expect(mockSessionsRepository.findOne).toHaveBeenCalledWith({ where: { id: mockSessionId }, relations: ['user'] });
    });

    // Optional: Add test for the edge case where the next question entity isn't found (data inconsistency)
    it('should return isComplete true if next question entity not found in DB', async () => {
        // Arrange: Session in progress, one answer submitted, but the next question (Q2) is missing from DB
        mockSessionsRepository.findOne.mockResolvedValue(mockSessionWithResponses);
        mockResponsesRepository.find.mockResolvedValue(mockSessionWithResponses.responses);
        mockQuestionsRepository.findOne.mockResolvedValue(null); // Simulate Question 2 not found
  
        // Act
        const result = await service.getNextQuestion(mockSessionId, mockUserId);
  
        // Assert
        expect(mockSessionsRepository.findOne).toHaveBeenCalledTimes(1);
        expect(mockResponsesRepository.find).toHaveBeenCalledTimes(1);
        expect(mockQuestionsRepository.findOne).toHaveBeenCalledWith({ where: { id: mockQuestionId2 }, relations: ['primarySkill'] });
        expect(result).toEqual<GetNextQuestionResponseDto>({
          isComplete: true, 
          nextQuestion: null
        });
      });

  });

});
