import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from './questions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Question, QuestionType, QuestionStatus } from './entities/question.entity';
import { Skill } from './entities/skill.entity';
import { Repository } from 'typeorm';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';

// Mock TypeORM repository
type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('QuestionsService', () => {
  let service: QuestionsService;
  let questionRepository: MockRepository<Question>;
  let skillRepository: MockRepository<Skill>;

  const mockSkill = { 
    id: 'skill-uuid-1', 
    name: 'Algebra', 
    description: 'Basic Algebra', 
    subject: 'Math',
    gradeLevel: 8,
    createdAt: new Date(),
    updatedAt: new Date(),
    questions: [],
    resources: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        { 
          provide: getRepositoryToken(Question), 
          useValue: createMockRepository<Question>() 
        },
        { 
          provide: getRepositoryToken(Skill), 
          useValue: createMockRepository<Skill>() 
        },
      ],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
    questionRepository = module.get<MockRepository<Question>>(getRepositoryToken(Question));
    skillRepository = module.get<MockRepository<Skill>>(getRepositoryToken(Skill));

    // Default mock for finding the skill needed for creation
    skillRepository.findOneBy.mockResolvedValue(mockSkill);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createQuestionDto: CreateQuestionDto = {
      questionText: 'What is 2 + 2?',
      questionType: QuestionType.MCQ,
      options: { choices: ['3', '4', '5'], answer: '4' },
      correctAnswer: '4',
      difficultyLevel: 1,
      gradeLevel: 8,
      primarySkillId: mockSkill.id,
    };
    const expectedQuestion = {
      id: 'question-uuid-1',
      text: createQuestionDto.questionText,
      type: createQuestionDto.questionType,
      options: createQuestionDto.options,
      answer: createQuestionDto.correctAnswer,
      difficulty: createQuestionDto.difficultyLevel,
      gradeLevel: createQuestionDto.gradeLevel,
      skill: mockSkill,
      status: QuestionStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
      assessmentSessions: [],
      responses: [],
      imageUrl: undefined,
    };

    it('should create and save a new question with a valid skillId', async () => {
      const createdEntity = { 
         ...expectedQuestion,
         skill: mockSkill 
        };
      questionRepository.create.mockReturnValue(createdEntity); 
      questionRepository.save.mockResolvedValue(createdEntity);

      const result = await service.create(createQuestionDto);

      expect(skillRepository.findOneBy).toHaveBeenCalledWith({ id: createQuestionDto.primarySkillId });
      expect(questionRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        text: createQuestionDto.questionText,
        type: createQuestionDto.questionType,
        options: createQuestionDto.options,
        answer: createQuestionDto.correctAnswer,
        difficulty: createQuestionDto.difficultyLevel,
        gradeLevel: createQuestionDto.gradeLevel,
        skill: mockSkill,
      }));
      expect(questionRepository.save).toHaveBeenCalledWith(createdEntity);
      expect(result).toEqual(createdEntity);
    });

    it('should throw NotFoundException if the skillId does not exist', async () => {
      skillRepository.findOneBy.mockResolvedValue(null);

      await expect(service.create(createQuestionDto)).rejects.toThrow(NotFoundException);
      expect(skillRepository.findOneBy).toHaveBeenCalledWith({ id: createQuestionDto.primarySkillId });
      expect(questionRepository.create).not.toHaveBeenCalled();
      expect(questionRepository.save).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on save error', async () => {
      skillRepository.findOneBy.mockResolvedValue(mockSkill);
      questionRepository.create.mockReturnValue(expectedQuestion);
      questionRepository.save.mockRejectedValue(new Error('DB Save Error'));

      await expect(service.create(createQuestionDto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findAll', () => {
    it('should return an array of questions', async () => {
      const question1 = { id: 'q-uuid1', text: 'Q1', type: QuestionType.MCQ, skill: mockSkill, createdAt: new Date(), updatedAt: new Date(), assessmentSessions: [], responses: [], answer: 'A', difficulty: 1, gradeLevel: 8, options: {}, status: QuestionStatus.DRAFT };
      const question2 = { id: 'q-uuid2', text: 'Q2', type: QuestionType.MCQ, skill: mockSkill, createdAt: new Date(), updatedAt: new Date(), assessmentSessions: [], responses: [], answer: 'B', difficulty: 2, gradeLevel: 8, options: {}, status: QuestionStatus.DRAFT };
      const expectedQuestions = [question1, question2];

      questionRepository.find.mockResolvedValue(expectedQuestions);

      const result = await service.findAll();

      expect(questionRepository.find).toHaveBeenCalled();
      expect(result).toEqual(expectedQuestions);
    });

    it('should return an empty array if no questions exist', async () => {
      questionRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(questionRepository.find).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should throw InternalServerErrorException on find error', async () => {
      questionRepository.find.mockRejectedValue(new Error('DB Find Error'));
      await expect(service.findAll()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findOne', () => {
    const questionId = 'q-uuid-1';
    const expectedQuestion = { 
      id: questionId, 
      text: 'Found Q', 
      type: QuestionType.MCQ, 
      skill: mockSkill, 
      createdAt: new Date(), 
      updatedAt: new Date(), 
      assessmentSessions: [], 
      responses: [], 
      answer: 'C', 
      difficulty: 3, 
      gradeLevel: 8, 
      options: {}, 
      status: QuestionStatus.DRAFT 
    };

    it('should return a question if found', async () => {
      questionRepository.findOneBy.mockResolvedValue(expectedQuestion);

      const result = await service.findOne(questionId);

      expect(questionRepository.findOneBy).toHaveBeenCalledWith({ id: questionId });
      expect(result).toEqual(expectedQuestion);
    });

    it('should throw NotFoundException if question is not found', async () => {
      questionRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(questionId)).rejects.toThrow(NotFoundException);
      expect(questionRepository.findOneBy).toHaveBeenCalledWith({ id: questionId });
    });

    it('should throw InternalServerErrorException on findOne error', async () => {
      questionRepository.findOneBy.mockRejectedValue(new Error('DB FindOne Error'));
      await expect(service.findOne(questionId)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('update', () => {
    const questionId = 'q-uuid-1';
    const updateQuestionDto: UpdateQuestionDto = {
      questionText: 'What is 3 + 3?',
      difficultyLevel: 2,
    };
    const existingQuestion = { 
      id: questionId, 
      text: 'What is 2 + 2?', 
      type: QuestionType.MCQ,
      skill: mockSkill, 
      createdAt: new Date(), 
      updatedAt: new Date(), 
      assessmentSessions: [], 
      responses: [], 
      answer: '4', 
      difficulty: 1, 
      gradeLevel: 8, 
      options: { choices: ['3', '4', '5'], answer: '4' }, 
      status: QuestionStatus.DRAFT 
    };
    const updatedQuestionEntity = {
      ...existingQuestion,
      text: updateQuestionDto.questionText,
      difficulty: updateQuestionDto.difficultyLevel,
      updatedAt: new Date(), // Should be updated by TypeORM
    };

    it('should update a question if found', async () => {
      questionRepository.findOneBy.mockResolvedValue(existingQuestion);
      questionRepository.save.mockResolvedValue(updatedQuestionEntity);

      const result = await service.update(questionId, updateQuestionDto);

      expect(questionRepository.findOneBy).toHaveBeenCalledWith({ id: questionId });
      // Check that save was called with the merged object
      expect(questionRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        ...existingQuestion,
        text: updateQuestionDto.questionText,
        difficulty: updateQuestionDto.difficultyLevel,
      }));
      expect(result).toEqual(updatedQuestionEntity);
    });

    it('should throw NotFoundException if question to update is not found', async () => {
      questionRepository.findOneBy.mockResolvedValue(null);

      await expect(service.update(questionId, updateQuestionDto)).rejects.toThrow(NotFoundException);
      expect(questionRepository.findOneBy).toHaveBeenCalledWith({ id: questionId });
      expect(questionRepository.save).not.toHaveBeenCalled();
    });

    // Optional: Add test case for updating the skill relation
    it('should update the skill relation if primarySkillId is provided', async () => {
      const newSkillId = 'skill-uuid-2';
      const newMockSkill = { ...mockSkill, id: newSkillId, name: 'Geometry' };
      const dtoWithNewSkill: UpdateQuestionDto = { primarySkillId: newSkillId };
      // The mockResolvedValue should represent the final entity state after save
      const updatedQuestionWithNewSkill = { 
        ...existingQuestion, 
        primarySkill: newMockSkill,
        updatedAt: new Date() // Simulate updatedAt change
      };

      questionRepository.findOneBy.mockResolvedValue(existingQuestion);
      skillRepository.findOneBy.mockResolvedValue(newMockSkill); // Mock finding the new skill
      questionRepository.save.mockResolvedValue(updatedQuestionWithNewSkill); // Mock the save result

      const result = await service.update(questionId, dtoWithNewSkill);

      expect(skillRepository.findOneBy).toHaveBeenCalledWith({ id: newSkillId });
      // Check the object passed to save includes the new skill
      expect(questionRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        ...existingQuestion,
        primarySkill: newMockSkill,
      }));
      // Verify the skill within the returned result object
      expect(result.primarySkill).toBeDefined();
      expect(result.primarySkill.id).toEqual(newSkillId);
    });

    it('should throw NotFoundException if primarySkillId in update DTO does not exist', async () => {
      const dtoWithInvalidSkill: UpdateQuestionDto = { primarySkillId: 'invalid-skill-uuid' };
      
      questionRepository.findOneBy.mockResolvedValue(existingQuestion); // Find the question
      skillRepository.findOneBy.mockResolvedValue(null); // Fail to find the new skill

      await expect(service.update(questionId, dtoWithInvalidSkill)).rejects.toThrow(NotFoundException);
      expect(skillRepository.findOneBy).toHaveBeenCalledWith({ id: dtoWithInvalidSkill.primarySkillId });
      expect(questionRepository.save).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on save error during update', async () => {
      questionRepository.findOneBy.mockResolvedValue(existingQuestion);
      questionRepository.save.mockRejectedValue(new Error('DB Update Error'));

      await expect(service.update(questionId, updateQuestionDto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('remove', () => {
    const questionId = 'q-uuid-1';

    it('should remove a question if found', async () => {
      // Mock the delete method to simulate successful deletion
      questionRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(questionId);

      expect(questionRepository.delete).toHaveBeenCalledWith(questionId);
    });

    it('should throw NotFoundException if question to remove is not found', async () => {
      // Mock the delete method to simulate deletion of a non-existent question
      questionRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(questionId)).rejects.toThrow(NotFoundException);
      expect(questionRepository.delete).toHaveBeenCalledWith(questionId);
    });

    it('should throw InternalServerErrorException on remove error', async () => {
      questionRepository.delete.mockRejectedValue(new Error('DB Remove Error'));
      await expect(service.remove(questionId)).rejects.toThrow(InternalServerErrorException);
    });
  });
});
