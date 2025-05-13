import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FinishAssessmentSessionDto {
  @ApiProperty({
    description: 'The ID of the user finishing the assessment session',
    example: 'user123'
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'The ID of the assessment session to finish',
    example: 'session456'
  })
  @IsString()
  @IsNotEmpty()
  assessmentSessionId: string;
} 