import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

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
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService], // Export if needed by other modules
})
export class AnalyticsModule {} 