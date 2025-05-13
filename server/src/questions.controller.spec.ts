import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Question, QuestionStatus, QuestionType } from './entities/question.entity';
import { Skill, SkillStatus } from './entities/skill.entity';
import { NotFoundException } from '@nestjs/common';

// Mock objects
const mockSkill: Skill = {
  id: 'skill-uuid-1',
  name: 'Algebra Basics',
  subject: 'Math',
  description: 'Fundamental concepts',
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
};

const mockQuestion1: Question = {
  id: 'q-uuid-1',
  questionText: 'Question 1?',
  questionType: QuestionType.MCQ,
  correctAnswer: 'Answer 1',
  gradeLevel: 5,
  primarySkill: mockSkill, // Use the defined mockSkill
  options: { choices: ['A', 'B'], correctIndex: 0 },
  difficultyLevel: 2,
  status: QuestionStatus.DRAFT,
  createdAt: new Date(),
  updatedAt: new Date(),
  responses: [],
  imageUrl: undefined,
};

describe('QuestionsController', () => {
  let controller: QuestionsController;
  let service: QuestionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionsController],
      providers: [
        {
          provide: QuestionsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<QuestionsController>(QuestionsController);
    service = module.get<QuestionsService>(QuestionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new question', async () => {
      const createDto: CreateQuestionDto = {
        questionText: 'New Question?',
        questionType: QuestionType.MCQ,
        correctAnswer: 'Answer',
        gradeLevel: 5,
        primarySkillId: 'skill-uuid',
        options: { choices: ['A', 'B'], correctIndex: 0 },
        difficultyLevel: 2,
      };
      const expectedResult: Question = {
        id: 'q-uuid-new',
        questionText: createDto.questionText,
        questionType: createDto.questionType,
        correctAnswer: createDto.correctAnswer,
        gradeLevel: createDto.gradeLevel,
        primarySkill: mockSkill,
        options: createDto.options,
        difficultyLevel: createDto.difficultyLevel,
        status: QuestionStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
        responses: [],
        imageUrl: undefined,
      };

      jest.spyOn(service, 'create').mockResolvedValue(expectedResult);
      const result = await controller.create(createDto);
      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of questions', async () => {
      const expectedResult: Question[] = [mockQuestion1];
      jest.spyOn(service, 'findAll').mockResolvedValue(expectedResult);
      const result = await controller.findAll();
      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single question', async () => {
      const questionId = 'q-uuid-1';
      jest.spyOn(service, 'findOne').mockResolvedValue(mockQuestion1);
      const result = await controller.findOne(questionId);
      expect(result).toEqual(mockQuestion1);
      expect(service.findOne).toHaveBeenCalledWith(questionId);
    });

    it('should throw NotFoundException if service throws it', async () => {
      const questionId = 'not-found-uuid';
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());
      await expect(controller.findOne(questionId)).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith(questionId);
    });
  });

  describe('update', () => {
    it('should update a question', async () => {
      const questionId = 'q-uuid-1';
      const updateDto: UpdateQuestionDto = { questionText: 'Updated Text?' };
      const expectedResult: Question = {
          ...mockQuestion1,
          questionText: 'Updated Text?'
      };

      jest.spyOn(service, 'update').mockResolvedValue(expectedResult);
      const result = await controller.update(questionId, updateDto);
      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(questionId, updateDto);
    });

    it('should throw NotFoundException if service throws it', async () => {
      const questionId = 'not-found-uuid';
      const updateDto: UpdateQuestionDto = { questionText: 'Updated Text?' };
      jest.spyOn(service, 'update').mockRejectedValue(new NotFoundException());
      await expect(controller.update(questionId, updateDto)).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith(questionId, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a question', async () => {
      const questionId = 'q-uuid-1';
      jest.spyOn(service, 'remove').mockResolvedValue(undefined); // remove returns void
      await controller.remove(questionId);
      expect(service.remove).toHaveBeenCalledWith(questionId);
    });

     it('should throw NotFoundException if service throws it', async () => {
      const questionId = 'not-found-uuid';
      jest.spyOn(service, 'remove').mockRejectedValue(new NotFoundException());
      await expect(controller.remove(questionId)).rejects.toThrow(NotFoundException);
      expect(service.remove).toHaveBeenCalledWith(questionId);
    });
  });
});
