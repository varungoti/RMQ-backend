import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitAnswerDto {
  @ApiProperty({ description: 'ID of the assessment session', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  assessmentSessionId: string;

  @ApiProperty({ description: 'ID of the question being answered', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ description: 'The user\'s submitted answer' })
  @IsString() 
  @IsNotEmpty() // Assuming an answer must be provided
  userResponse: string; // The user's submitted answer
  
  // Could add responseTimeMs later
} 