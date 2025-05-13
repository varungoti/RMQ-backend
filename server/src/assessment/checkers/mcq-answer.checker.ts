import { Injectable, Logger } from '@nestjs/common';
import { Question, QuestionType } from '../../entities/question.entity';
import { AnswerChecker } from '../interfaces/answer-checker.interface';

/**
 * Answer checker for multiple-choice questions
 * Handles MCQ-specific validation
 */
@Injectable()
export class McqAnswerChecker implements AnswerChecker {
  private readonly logger = new Logger(McqAnswerChecker.name);

  /**
   * Check if user response matches the correct answer for a multiple-choice question
   * Ensures the answer is a valid option and matches the correct answer
   * 
   * @param question The MCQ question entity
   * @param userResponse The user's selected option
   * @returns True if selected option is correct, false otherwise
   */
  isCorrect(question: Question, userResponse: string): boolean {
    // First, validate this is the right type of question
    if (question.questionType !== QuestionType.MCQ) {
      this.logger.warn(
        `McqAnswerChecker used with incompatible question type: ${question.questionType}`
      );
      // Fallback to simple string comparison
      return userResponse.toLowerCase() === question.correctAnswer.toLowerCase();
    }

    // Normalize the response for comparison (trim and convert to uppercase)
    const normalizedResponse = userResponse.trim().toUpperCase();
    const normalizedCorrectAnswer = question.correctAnswer.trim().toUpperCase();
    
    // Check if options exist
    if (!question.options) {
      this.logger.warn(`MCQ Question ${question.id} has no options defined`);
      return normalizedResponse === normalizedCorrectAnswer;
    }

    // Verify the response is a valid option
    const validOptions = Object.keys(question.options);
    if (!validOptions.map(o => o.toUpperCase()).includes(normalizedResponse)) {
      this.logger.warn(
        `Invalid MCQ response for question ${question.id}: "${userResponse}". ` +
        `Valid options are: ${validOptions.join(', ')}`
      );
      return false;
    }

    // Check if the selected option is correct
    const result = normalizedResponse === normalizedCorrectAnswer;
    this.logger.debug(
      `MCQ Check for question ${question.id}: ` +
      `User selected "${userResponse}", correct is "${question.correctAnswer}". ` +
      `Result: ${result ? 'CORRECT' : 'INCORRECT'}`
    );
    return result;
  }
} 