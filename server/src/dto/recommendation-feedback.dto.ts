import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { FeedbackType, FeedbackSource } from '../entities/recommendation_feedback.entity';

export class CreateRecommendationFeedbackDto {
  @ApiProperty({
    enum: FeedbackType,
    description: 'Type of feedback provided',
  })
  @IsEnum(FeedbackType)
  feedbackType: FeedbackType;

  @ApiPropertyOptional({
    enum: FeedbackSource,
    description: 'Source of the feedback',
    default: FeedbackSource.USER,
  })
  @IsEnum(FeedbackSource)
  @IsOptional()
  source?: FeedbackSource = FeedbackSource.USER;

  @ApiPropertyOptional({
    description: 'Additional comments about the feedback',
  })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({
    description: 'Impact score of the feedback (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  impactScore?: number;

  @ApiPropertyOptional({
    description: 'Additional metadata about the feedback',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class RecommendationFeedbackResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the feedback',
  })
  id: string;

  @ApiProperty({
    description: 'ID of the user who provided the feedback',
  })
  userId: string;

  @ApiProperty({
    description: 'ID of the recommendation this feedback is for',
  })
  recommendationId: string;

  @ApiProperty({
    enum: FeedbackType,
    description: 'Type of feedback provided',
  })
  feedbackType: FeedbackType;

  @ApiProperty({
    enum: FeedbackSource,
    description: 'Source of the feedback',
  })
  source: FeedbackSource;

  @ApiPropertyOptional({
    description: 'Additional comments about the feedback',
  })
  comment?: string;

  @ApiPropertyOptional({
    description: 'Impact score of the feedback (0-100)',
  })
  impactScore?: number;

  @ApiPropertyOptional({
    description: 'Additional metadata about the feedback',
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'When the feedback was created',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the feedback was last updated',
  })
  updatedAt: Date;
} 