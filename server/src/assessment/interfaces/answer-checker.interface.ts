import { Question } from '../../entities/question.entity';

/**
 * Interface for implementing different answer checking strategies
 * based on question types
 */
export interface AnswerChecker {
  /**
   * Checks if a user's answer is correct
   * 
   * @param question The question entity with the correct answer
   * @param userResponse The user's submitted answer
   * @returns True if the answer is correct, false otherwise
   */
  isCorrect(question: Question, userResponse: string): boolean;
} 