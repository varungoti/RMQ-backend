import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessAssessmentResponseDto {
  @ApiProperty({
    description: 'The ID of the user submitting the assessment response',
    example: 'user123'
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'The ID of the assessment session',
    example: 'session456'
  })
  @IsString()
  @IsNotEmpty()
  assessmentSessionId: string;

  @ApiProperty({
    description: 'The ID of the question being answered',
    example: 'question789'
  })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({
    description: 'The user\'s response to the question',
    example: 'Option A'
  })
  @IsString()
  @IsNotEmpty()
  userResponse: string;
} 