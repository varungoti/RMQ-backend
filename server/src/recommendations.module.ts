import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { AiRecommendationService } from './ai-recommendation.service';
import { LlmFactoryService } from './llm/llm-factory.service';
import { RedisModule } from './redis.module';
import { MetricsModule } from './metrics/metrics.module';
import { Recommendation } from './entities/recommendation.entity';
import { RecommendationHistory } from './entities/recommendation_history.entity';
import { RecommendationResource } from './entities/recommendation_resource.entity';
import { RecommendationFeedback } from './entities/recommendation_feedback.entity';

// Import required entities
import { User } from './entities/user.entity';
import { Skill } from './entities/skill.entity';
import { AssessmentSession } from './entities/assessment_session.entity';
import { AssessmentResponse } from './entities/assessment_response.entity';
import { AssessmentSkillScore } from './entities/assessment_skill_score.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Skill,
      AssessmentSession,
      AssessmentResponse,
      AssessmentSkillScore,
      Recommendation,
      RecommendationHistory,
      RecommendationResource,
      RecommendationFeedback,
    ]),
    RedisModule,
    MetricsModule,
  ],
  controllers: [RecommendationsController],
  providers: [
    RecommendationsService,
    AiRecommendationService,
    LlmFactoryService,
  ],
  exports: [RecommendationsService, AiRecommendationService],
})
export class RecommendationsModule {} 