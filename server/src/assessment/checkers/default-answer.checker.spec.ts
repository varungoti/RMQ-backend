import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { DefaultAnswerChecker } from './default-answer.checker';
import { Question, QuestionType } from '../../entities/question.entity';

describe('DefaultAnswerChecker', () => {
  let checker: DefaultAnswerChecker;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DefaultAnswerChecker],
    }).compile();

    checker = module.get<DefaultAnswerChecker>(DefaultAnswerChecker);
    
    // Mock logger to avoid console output in tests
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  it('should be defined', () => {
    expect(checker).toBeDefined();
  });

  describe('isCorrect', () => {
    it('should return true when the answer matches exactly', () => {
      const question = {
        id: '1',
        correctAnswer: 'Correct Answer',
        questionType: QuestionType.SHORT_ANSWER,
      } as Question;

      expect(checker.isCorrect(question, 'Correct Answer')).toBe(true);
    });

    it('should return true for case-insensitive matches', () => {
      const question = {
        id: '1',
        correctAnswer: 'Correct Answer',
        questionType: QuestionType.SHORT_ANSWER,
      } as Question;

      expect(checker.isCorrect(question, 'correct answer')).toBe(true);
      expect(checker.isCorrect(question, 'CORRECT ANSWER')).toBe(true);
      expect(checker.isCorrect(question, 'Correct answer')).toBe(true);
    });

    it('should return false for non-matching answers', () => {
      const question = {
        id: '1',
        correctAnswer: 'Correct Answer',
        questionType: QuestionType.SHORT_ANSWER,
      } as Question;

      expect(checker.isCorrect(question, 'Wrong Answer')).toBe(false);
      expect(checker.isCorrect(question, 'Almost Correct Answer')).toBe(false);
      expect(checker.isCorrect(question, 'CorrectAnswer')).toBe(false); // No space
    });

    it('should handle whitespace in answers', () => {
      const question = {
        id: '1',
        correctAnswer: ' Correct Answer ',
        questionType: QuestionType.SHORT_ANSWER,
      } as Question;

      // Keeping the whitespace as is would have these return false
      // since we're using direct string comparison
      expect(checker.isCorrect(question, 'Correct Answer')).toBe(false);
      expect(checker.isCorrect(question, ' Correct Answer')).toBe(false);
      expect(checker.isCorrect(question, 'Correct Answer ')).toBe(false);
      
      // Only exact match with whitespace would return true
      expect(checker.isCorrect(question, ' Correct Answer ')).toBe(true);
    });
    
    it('should handle special characters', () => {
      const question = {
        id: '1',
        correctAnswer: 'Answer (with) special-characters!',
        questionType: QuestionType.SHORT_ANSWER,
      } as Question;

      expect(checker.isCorrect(question, 'Answer (with) special-characters!')).toBe(true);
      expect(checker.isCorrect(question, 'answer (with) special-characters!')).toBe(true);
      expect(checker.isCorrect(question, 'Answer (without) special-characters!')).toBe(false);
    });
  });
}); 