import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class FinishSessionDto {
  @ApiProperty({
    description: 'Assessment session ID to finish',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'Assessment session ID is required' })
  @IsUUID(4, { message: 'Assessment session ID must be a valid UUID v4' })
  assessmentSessionId: string;
} 