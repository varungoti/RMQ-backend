import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiMetricsService } from './ai-metrics.service';
import { RedisModule } from '../redis.module';
import { RecommendationFeedback } from '../entities/recommendation_feedback.entity';
import { Skill } from '../entities/skill.entity';
import { FeedbackValidationService } from '../services/feedback-validation.service';
import { FeedbackAnalysisService } from '../services/feedback-analysis.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecommendationFeedback, Skill]),
    RedisModule,
  ],
  providers: [
    AiMetricsService,
    FeedbackValidationService,
    FeedbackAnalysisService,
  ],
  exports: [
    AiMetricsService,
    FeedbackValidationService,
    FeedbackAnalysisService,
  ],
})
export class MetricsModule {} 