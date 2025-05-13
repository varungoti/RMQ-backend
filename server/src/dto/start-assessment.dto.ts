import { IsNumber, IsOptional, Min, Max, IsInt, IsUUID } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class StartAssessmentDto {
  // For MVP, we might infer grade from the logged-in user.
  // Making it optional here allows flexibility.
  @ApiPropertyOptional({ 
    description: 'Optional: Specify the grade level for the assessment. Defaults to user\'s grade if omitted.', 
    minimum: 1, 
    maximum: 12, 
    example: 10 
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(12) // Assuming grades 1-12
  gradeLevel?: number;

  @ApiProperty({
    description: 'Specific skill ID to assess',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    format: 'uuid'
  })
  @IsUUID()
  skillId: string;

  // Could add subject or specific skill IDs later
} 