import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class SkillScoreDto {
  @ApiProperty({ description: 'Unique identifier for the skill score record', example: 'a1b2c3d4-...' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'ID of the associated user', example: 'e5f6g7h8-...' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'ID of the assessed skill', example: 'i9j0k1l2-...' })
  @IsUUID()
  skillId: string;

  @ApiProperty({ description: 'Score obtained for the skill', example: 85 })
  @IsNumber()
  score: number;

  @ApiProperty({ description: 'Assessment level achieved', example: 3 })
  @IsNumber()
  level: number;

  @ApiProperty({ description: 'Timestamp when the score was last updated' })
  @IsDateString()
  lastAssessedAt: Date;
}

export class SkillScoreUpdateDto {
  @ApiProperty({ description: 'Score obtained for the skill', example: 90, required: false })
  @IsNumber()
  @IsOptional()
  score?: number;

  @ApiProperty({ description: 'Assessment level achieved', example: 4, required: false })
  @IsNumber()
  @IsOptional()
  level?: number;
} 