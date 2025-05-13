import { Injectable, Logger } from '@nestjs/common';
import { Question, QuestionType } from '../../entities/question.entity';
import { AnswerChecker } from '../interfaces/answer-checker.interface';
import { DefaultAnswerChecker } from '../checkers/default-answer.checker';
import { McqAnswerChecker } from '../checkers/mcq-answer.checker';
import { TrueFalseAnswerChecker } from '../checkers/true-false-answer.checker';
import { NumericalAnswerChecker } from '../checkers/numerical-answer.checker';

/**
 * Factory for creating the appropriate answer checker based on question type
 */
@Injectable()
export class AnswerCheckerFactory {
  private readonly logger = new Logger(AnswerCheckerFactory.name);
  
  constructor(
    private readonly defaultChecker: DefaultAnswerChecker,
    private readonly mcqChecker: McqAnswerChecker,
    private readonly trueFalseChecker: TrueFalseAnswerChecker,
    private readonly numericalChecker: NumericalAnswerChecker,
  ) {}
  
  /**
   * Get the appropriate answer checker for a question
   * 
   * @param question The question entity
   * @returns The appropriate answer checker for the question type
   */
  getChecker(question: Question): AnswerChecker {
    this.logger.debug(`Getting checker for question ${question.id}, type: ${question.questionType}`);
    
    switch (question.questionType) {
      case QuestionType.MCQ:
        return this.mcqChecker;
        
      case QuestionType.TRUE_FALSE:
        return this.trueFalseChecker;
        
      case QuestionType.NUMERICAL:
        return this.numericalChecker;
        
      default:
        this.logger.debug(`No specialized checker for type ${question.questionType}, using default`);
        return this.defaultChecker;
    }
  }
  
  /**
   * Check if an answer is correct using the appropriate checker
   * 
   * @param question The question entity
   * @param userResponse The user's response
   * @returns True if the answer is correct, false otherwise
   */
  checkAnswer(question: Question, userResponse: string): boolean {
    const checker = this.getChecker(question);
    return checker.isCorrect(question, userResponse);
  }
} 