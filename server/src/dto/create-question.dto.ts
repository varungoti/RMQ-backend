import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  MaxLength,
  IsNumber,
  Min,
  Max,
  IsUUID,
  IsObject,
  ValidateIf,
  IsUrl,
} from 'class-validator';
import { QuestionType, QuestionStatus } from 'src/entities/question.entity'; // Import the enums
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; // Import Swagger decorators

export class CreateQuestionDto {
  @ApiProperty({ description: 'The main text of the question', maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  questionText: string;

  @ApiProperty({ description: 'The type of the question', enum: QuestionType })
  @IsEnum(QuestionType)
  @IsNotEmpty()
  questionType: QuestionType;

  @ApiPropertyOptional({ 
    description: 'Options for multiple-choice questions (MCQ)', 
    type: 'object', 
    example: { a: 'Option 1', b: 'Option 2' },
    additionalProperties: true
  })
  @IsObject()
  @ValidateIf((o: CreateQuestionDto) => o.questionType === QuestionType.MCQ)
  @IsOptional()
  options?: Record<string, unknown>;

  @ApiProperty({ description: 'The correct answer to the question', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  correctAnswer: string;

  @ApiPropertyOptional({ description: 'Difficulty level (1-5)', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  difficultyLevel?: number;

  @ApiProperty({ description: 'Target grade level (1-12)', minimum: 1, maximum: 12 })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(12)
  gradeLevel: number;

  @ApiProperty({ description: 'ID of the primary skill this question assesses', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  primarySkillId: string;

  @ApiPropertyOptional({ description: 'URL of an optional image associated with the question' })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Status of the question', enum: QuestionStatus, default: QuestionStatus.DRAFT })
  @IsEnum(QuestionStatus)
  @IsOptional()
  status?: QuestionStatus;
}
