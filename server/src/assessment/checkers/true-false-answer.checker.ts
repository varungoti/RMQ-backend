import { Injectable, Logger } from '@nestjs/common';
import { Question, QuestionType } from '../../entities/question.entity';
import { AnswerChecker } from '../interfaces/answer-checker.interface';

/**
 * Answer checker for true/false questions
 * Handles flexible response formats for boolean answers
 */
@Injectable()
export class TrueFalseAnswerChecker implements AnswerChecker {
  private readonly logger = new Logger(TrueFalseAnswerChecker.name);
  
  // Valid representations for "true" responses
  private readonly trueValues = ['true', 't', 'yes', 'y', '1'];
  
  // Valid representations for "false" responses
  private readonly falseValues = ['false', 'f', 'no', 'n', '0'];

  /**
   * Check if user response matches the correct answer for a true/false question
   * Accepts various formats for true/false values
   * 
   * @param question The true/false question entity
   * @param userResponse The user's response in various accepted formats
   * @returns True if the boolean value matches the correct answer, false otherwise
   */
  isCorrect(question: Question, userResponse: string): boolean {
    // First, validate this is the right type of question
    if (question.questionType !== QuestionType.TRUE_FALSE) {
      this.logger.warn(
        `TrueFalseAnswerChecker used with incompatible question type: ${question.questionType}`
      );
      // Fallback to simple string comparison
      return userResponse.toLowerCase() === question.correctAnswer.toLowerCase();
    }

    // Normalize the user response to lowercase and trim whitespace
    const normalizedResponse = userResponse.toLowerCase().trim();
    
    // Determine the boolean value of the user's response
    let userBooleanResponse: boolean | null = null;
    
    if (this.trueValues.includes(normalizedResponse)) {
      userBooleanResponse = true;
    } else if (this.falseValues.includes(normalizedResponse)) {
      userBooleanResponse = false;
    } else {
      this.logger.warn(
        `Invalid TRUE/FALSE response for question ${question.id}: "${userResponse}". ` +
        `Valid values are: true/false, t/f, yes/no, y/n, 1/0`
      );
      return false;
    }
    
    // Normalize the correct answer to a boolean value
    const correctAnswerLower = question.correctAnswer.toLowerCase().trim();
    const correctBooleanAnswer = this.trueValues.includes(correctAnswerLower);
    
    // Compare the boolean values
    const result = userBooleanResponse === correctBooleanAnswer;
    this.logger.debug(
      `TRUE/FALSE Check for question ${question.id}: ` +
      `User responded "${userResponse}" (${userBooleanResponse}), ` +
      `correct is "${question.correctAnswer}" (${correctBooleanAnswer}). ` +
      `Result: ${result ? 'CORRECT' : 'INCORRECT'}`
    );
    return result;
  }
} 