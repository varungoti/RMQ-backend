import { ApiProperty } from '@nestjs/swagger';

export class AssessmentMessageResponseDto {
  @ApiProperty({
    description: 'Whether the operation was successful',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'Optional message providing additional information',
    example: 'Assessment response processed successfully',
    required: false
  })
  message?: string;

  @ApiProperty({
    description: 'Optional error details in case of failure',
    required: false
  })
  error?: {
    code: string;
    details: string;
  };
}

export class AssessmentSessionResultDto extends AssessmentMessageResponseDto {
  @ApiProperty({
    description: 'The ID of the completed assessment session',
    example: 'session456'
  })
  assessmentSessionId: string;

  @ApiProperty({
    description: 'The final score of the assessment',
    example: 85
  })
  score: number;

  @ApiProperty({
    description: 'The achieved level based on the score',
    example: 3
  })
  level: number;
} 