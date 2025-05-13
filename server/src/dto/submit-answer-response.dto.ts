import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsBoolean, IsDate, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Data Transfer Object for the response returned when submitting an answer
 */
export class SubmitAnswerResponseDto {
  @ApiProperty({ description: 'Unique identifier of the answer submission' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'User\'s response to the question' })
  @IsString()
  userResponse: string;

  @ApiProperty({ description: 'Whether the user\'s answer is correct' })
  @IsBoolean()
  isCorrect: boolean;

  @ApiProperty({ description: 'Timestamp when the answer was submitted' })
  @IsDate()
  @Type(() => Date)
  answeredAt: Date;

  @ApiPropertyOptional({ description: 'The assessment session this answer belongs to' })
  @IsObject()
  assessmentSession?: Record<string, any>;

  @ApiPropertyOptional({ description: 'The question that was answered' })
  @IsObject()
  question?: Record<string, any>;

  // Property for backward compatibility
  @ApiPropertyOptional({ description: 'Alias for isCorrect (backward compatibility)' })
  @IsBoolean()
  correct?: boolean;
} 