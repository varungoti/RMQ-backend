import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsUUID,
  ValidateNested,
  IsObject,
  IsArray,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { QuestionType, QuestionStatus } from '../entities/question.entity';
import { GraphQLJSONObject } from 'graphql-type-json'; // For options

// Base DTO for common properties
class QuestionBaseDto {
  @ApiProperty({ description: 'The main text of the question', example: 'What is 2 + 2?' })
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @ApiProperty({ enum: QuestionType, description: 'Type of the question' })
  @IsEnum(QuestionType)
  questionType: QuestionType;

  @ApiPropertyOptional({
    description: 'Options for the question (structure depends on type)',
    example: { choices: ['A', 'B', 'C', 'D'] },
  })
  @IsOptional()
  @IsObject() // Basic validation for object, specific structure validation can be complex
  options?: Record<string, unknown>; // Using Record<string, unknown> for flexibility

  @ApiProperty({ description: 'The correct answer(s)', example: '4' })
  @IsString()
  @IsNotEmpty()
  correctAnswer: string;

  @ApiPropertyOptional({
    description: 'Difficulty level (e.g., 1-5 or 1-1000)',
    example: 300,
  })
  @IsOptional()
  @IsInt()
  difficultyLevel?: number;

  @ApiProperty({ description: 'Target grade level', example: 5, minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  gradeLevel: number;

  @ApiPropertyOptional({ enum: QuestionStatus, description: 'Status of the question', default: QuestionStatus.DRAFT })
  @IsOptional()
  @IsEnum(QuestionStatus)
  status?: QuestionStatus;

  @ApiPropertyOptional({ description: 'URL for an associated image' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

// DTO for creating a new question
export class CreateQuestionDto extends QuestionBaseDto {
  @ApiProperty({ description: 'UUID of the primary skill this question assesses' })
  @IsUUID()
  primarySkillId: string;
}

// DTO for updating an existing question (all fields optional)
export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {}

// DTO representing a Question returned by the API (could be same as entity or selective)
// For now, let's assume it mirrors CreateQuestionDto but includes ID and timestamps
// We might need a separate PublicQuestionDto later if correctAnswer needs hiding.
export class QuestionDto extends CreateQuestionDto {
    @ApiProperty({ description: 'Unique identifier (UUID)' })
    @IsUUID()
    id: string;

    @ApiProperty({ description: 'Timestamp of creation' })
    createdAt: Date;

    @ApiProperty({ description: 'Timestamp of last update' })
    updatedAt: Date;
    
    // Note: We might need to add the full Skill object here if needed by frontend
} 