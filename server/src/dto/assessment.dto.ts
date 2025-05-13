import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType } from 'src/entities/question.entity'; // Assuming QuestionType enum exists
import { Skill } from 'src/entities/skill.entity'; // Assuming Skill entity exists
import { GraphQLJSONObject } from 'graphql-type-json'; // For JSON object

/**
 * DTO for Question data excluding the correct answer.
 */
export class QuestionPublicDto {
  @ApiProperty({ description: 'Unique identifier for the question', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'The text of the question' })
  questionText: string; // Use the entity field name

  @ApiProperty({ enum: QuestionType, description: 'The type of question (e.g., multiple-choice)' })
  type: QuestionType; // Assuming 'type' maps to 'questionType' in the service/controller mapping

  // Corrected type to match entity's JSONB structure and satisfy Swagger
  @ApiProperty({
      description: 'Possible answer options (structure depends on question type)',
      type: 'object', 
      additionalProperties: true, // Allow any properties for JSON object
      example: { 'A': 'Option A', 'B': 'Option B', 'C': 'Option C' } 
  })
  options?: Record<string, unknown>; 

  @ApiProperty({ description: 'The skill this question relates to' })
  skill: Skill; // Assuming skill relation is included. Adjust if needed.

  @ApiProperty({ description: 'Difficulty level (e.g., 1-5 or ELO)' })
  difficultyLevel?: number; // Use the entity field name

  // 'correctAnswer' is intentionally omitted
}

/**
 * Response DTO for the getNextQuestion endpoint.
 */
export class GetNextQuestionResponseDto {
  @ApiProperty({ description: 'Indicates if the assessment session is complete (no more questions).' })
  isComplete: boolean;

  @ApiPropertyOptional({ 
    type: QuestionPublicDto, 
    description: 'The next question to be answered, or null if the assessment is complete. The correctAnswer field is omitted.'
  })
  nextQuestion: QuestionPublicDto | null;
}

// Removed old: type QuestionPublic = Omit<Question, 'correctAnswer'>;
// Removed old: interface GetNextQuestionResponse { ... } 

// Convert from interface to class with decorators
export class AssessmentResponseDto {
  @ApiProperty({ description: 'Unique identifier for the assessment response', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'The response provided by the user' })
  userResponse: string;

  @ApiProperty({ description: 'Whether the answer is correct' })
  isCorrect: boolean;

  @ApiProperty({ description: 'When the answer was submitted' })
  answeredAt: Date;

  @ApiPropertyOptional({ description: 'Time taken to answer in milliseconds' })
  responseTimeMs?: number;

  @ApiProperty({ description: 'The assessment session information' })
  assessmentSession: {
    id: string;
    status: string;
  };

  @ApiProperty({ description: 'The question information' })
  question: {
    id: string;
    questionText: string;
    questionType: string;
    options?: Record<string, unknown>;
    difficultyLevel?: number;
  };
} 