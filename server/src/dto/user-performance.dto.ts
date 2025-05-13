import { IsUUID, IsOptional, IsNumber, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserPerformanceQueryDto {
  @ApiPropertyOptional({ description: 'Target User ID (Admin/Teacher only)', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  userId?: string; // Optional, will use authenticated user if not provided (admin can query others)

  @ApiPropertyOptional({ description: 'Filter start date (ISO 8601 format)', example: '2023-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string; // ISO date string for filtering by date range

  @ApiPropertyOptional({ description: 'Filter end date (ISO 8601 format)', example: '2023-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string; // ISO date string for filtering by date range

  @ApiPropertyOptional({ description: 'Filter by grade level', minimum: 1, maximum: 12, example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  @Type(() => Number) // Transform string to number for query params
  gradeLevel?: number; // Filter by grade level

  @ApiPropertyOptional({ description: 'Filter by specific skill ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  skillId?: string; // Filter by specific skill
}

// Response DTOs for analytics endpoints
export class SkillPerformanceDto {
  @ApiProperty({ description: 'ID of the skill', format: 'uuid' })
  skillId: string;

  @ApiProperty({ description: 'Name of the skill' })
  skillName: string;

  @ApiProperty({ description: 'Latest calculated score for the skill' })
  score: number;

  @ApiProperty({ description: 'Total number of questions attempted for this skill' })
  questionsAttempted: number;

  @ApiProperty({ description: 'Number of correct answers for this skill' })
  correctAnswers: number;

  @ApiProperty({ description: 'Number of incorrect answers for this skill' })
  incorrectAnswers: number;

  @ApiProperty({ description: 'Date of the last attempt for this skill' })
  lastAttemptDate: Date;
}

export class AssessmentSummaryDto {
  @ApiProperty({ description: 'ID of the assessment session', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Timestamp when the assessment started' })
  startedAt: Date;

  @ApiPropertyOptional({ description: 'Timestamp when the assessment was completed (null if in progress)' })
  completedAt: Date | null;

  @ApiProperty({ description: 'Current status of the assessment (e.g., IN_PROGRESS, COMPLETED)' })
  status: string;

  @ApiProperty({ description: 'Total number of questions in the assessment' })
  totalQuestions: number;

  @ApiProperty({ description: 'Number of questions answered so far' })
  answeredQuestions: number;

  @ApiProperty({ description: 'Number of questions answered correctly' })
  correctAnswers: number;

  @ApiProperty({ description: 'Percentage of correctly answered questions' })
  percentageCorrect: number;
}

export class UserPerformanceDto {
  @ApiProperty({ description: 'ID of the user', format: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Username of the user' })
  username: string;

  @ApiProperty({ description: 'Email of the user' })
  email: string;

  @ApiProperty({ description: 'Grade level of the user' })
  gradeLevel: number;

  @ApiProperty({ description: 'Calculated overall score/proficiency of the user' })
  overallScore: number;

  @ApiProperty({ description: 'Total number of assessments taken by the user' })
  assessmentCount: number;

  @ApiProperty({ type: [SkillPerformanceDto], description: 'Performance breakdown per skill' })
  skillPerformance: SkillPerformanceDto[];

  @ApiProperty({ type: [AssessmentSummaryDto], description: 'Summary of recent assessments taken' })
  recentAssessments: AssessmentSummaryDto[];
} 