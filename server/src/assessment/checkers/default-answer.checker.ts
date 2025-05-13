import { Injectable, Logger } from '@nestjs/common';
import { Question } from '../../entities/question.entity';
import { AnswerChecker } from '../interfaces/answer-checker.interface';

/**
 * Default answer checker that uses simple string comparison
 * Used as a fallback or for simple question types
 */
@Injectable()
export class DefaultAnswerChecker implements AnswerChecker {
  private readonly logger = new Logger(DefaultAnswerChecker.name);

  /**
   * Check if user response matches the correct answer using direct string comparison
   * 
   * @param question The question entity with the correct answer
   * @param userResponse The user's submitted answer
   * @returns True if the strings match (case-insensitive), false otherwise
   */
  isCorrect(question: Question, userResponse: string): boolean {
    this.logger.debug(
      `DefaultAnswerChecker: Comparing answer for question ${question.id}. ` +
      `User response: "${userResponse}", Correct answer: "${question.correctAnswer}"`
    );
    
    // Perform case-insensitive string comparison
    return userResponse.toLowerCase() === question.correctAnswer.toLowerCase();
  }
} 