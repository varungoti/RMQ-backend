import { Injectable, Logger } from '@nestjs/common';
import { Question, QuestionType } from '../../entities/question.entity';
import { AnswerChecker } from '../interfaces/answer-checker.interface';

/**
 * Interface for numerical answer verification options
 */
interface NumericalAnswerOptions {
  absoluteTolerance?: number;  // Absolute difference allowed
  relativeTolerance?: number;  // Percentage tolerance allowed (0-1)
  units?: string;              // Expected units (if any)
}

/**
 * Answer checker for numerical questions
 * Supports tolerance ranges and unit verification
 */
@Injectable()
export class NumericalAnswerChecker implements AnswerChecker {
  private readonly logger = new Logger(NumericalAnswerChecker.name);

  // Default tolerance values
  private readonly DEFAULT_ABSOLUTE_TOLERANCE = 0.001;
  private readonly DEFAULT_RELATIVE_TOLERANCE = 0.01; // 1%

  /**
   * Check if user response matches the correct answer for a numerical question
   * Supports absolute and relative tolerance, and optional unit verification
   * 
   * @param question The numerical question entity
   * @param userResponse The user's numerical answer
   * @returns True if the answer is within tolerance, false otherwise
   */
  isCorrect(question: Question, userResponse: string): boolean {
    // First, validate this is the right type of question
    if (question.questionType !== QuestionType.NUMERICAL) {
      this.logger.warn(
        `NumericalAnswerChecker used with incompatible question type: ${question.questionType}`
      );
      // Fallback to simple string comparison
      return userResponse.toLowerCase() === question.correctAnswer.toLowerCase();
    }

    // Extract options from question (if available)
    const options: NumericalAnswerOptions = (question.options as any)?.numericalOptions || {};
    const absoluteTolerance = options.absoluteTolerance || this.DEFAULT_ABSOLUTE_TOLERANCE;
    const relativeTolerance = options.relativeTolerance || this.DEFAULT_RELATIVE_TOLERANCE;
    const expectedUnits = options.units;

    try {
      // Process the correct answer
      const { value: correctValue, units: correctUnits } = this.parseNumericalAnswer(question.correctAnswer);
      
      // Process the user response
      const { value: userValue, units: userUnits } = this.parseNumericalAnswer(userResponse);
      
      // Check units if expected
      if (expectedUnits && userUnits !== expectedUnits) {
        this.logger.debug(
          `Numerical question ${question.id}: Units mismatch. ` +
          `Expected "${expectedUnits}", got "${userUnits || 'none'}"`
        );
        return false;
      }
      
      // Check value within tolerance
      const absoluteDifference = Math.abs(correctValue - userValue);
      const relativeDifference = correctValue !== 0 
        ? absoluteDifference / Math.abs(correctValue)
        : absoluteDifference;
      
      const withinAbsoluteTolerance = absoluteDifference <= absoluteTolerance;
      const withinRelativeTolerance = relativeDifference <= relativeTolerance;
      
      const isCorrect = withinAbsoluteTolerance || withinRelativeTolerance;
      
      this.logger.debug(
        `Numerical check for question ${question.id}: ` +
        `User: ${userValue}${userUnits || ''}, Correct: ${correctValue}${correctUnits || ''}, ` +
        `Abs diff: ${absoluteDifference}, Rel diff: ${relativeDifference * 100}%, ` +
        `Result: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`
      );
      
      return isCorrect;
    } catch (error) {
      this.logger.warn(
        `Error checking numerical answer for question ${question.id}: ${error.message}`
      );
      return false;
    }
  }

  /**
   * Parse a numerical answer string into value and optional units
   * 
   * @param answer The answer string (e.g., "42", "3.14", "10 kg")
   * @returns Object containing the numerical value and optional units
   */
  private parseNumericalAnswer(answer: string): { value: number; units?: string } {
    // Remove extra whitespace and normalize
    const cleanAnswer = answer.trim();
    
    // Regular expression to match a number followed by optional units
    // Matches scientific notation, decimals, etc.
    const regex = /^(-?\d*\.?\d+(?:e[-+]?\d+)?)\s*(.*)$/i;
    const match = cleanAnswer.match(regex);
    
    if (!match) {
      throw new Error(`Invalid numerical format: "${answer}"`);
    }
    
    const valueStr = match[1];
    const units = match[2].trim();
    
    const value = parseFloat(valueStr);
    if (isNaN(value)) {
      throw new Error(`Failed to parse number: "${valueStr}"`);
    }
    
    return {
      value,
      units: units || undefined
    };
  }
} 