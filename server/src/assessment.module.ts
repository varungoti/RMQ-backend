import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentService } from './assessment.service';
import { AssessmentController } from './assessment.controller';

// Import Entities needed by this module
import { AssessmentSession } from './entities/assessment_session.entity';
import { AssessmentResponse } from './entities/assessment_response.entity';
import { AssessmentSkillScore } from './entities/assessment_skill_score.entity';
import { Question } from './entities/question.entity';
import { User } from './entities/user.entity';
import { Skill } from './entities/skill.entity';

// Import answer checker components
import { DefaultAnswerChecker } from './assessment/checkers/default-answer.checker';
import { McqAnswerChecker } from './assessment/checkers/mcq-answer.checker';
import { TrueFalseAnswerChecker } from './assessment/checkers/true-false-answer.checker';
import { NumericalAnswerChecker } from './assessment/checkers/numerical-answer.checker';
import { AnswerCheckerFactory } from './assessment/factories/answer-checker.factory';

// Potentially import other modules if services are needed
// import { QuestionsModule } from './questions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssessmentSession,
      AssessmentResponse,
      AssessmentSkillScore,
      Question,
      User,
      Skill,
    ]),
    // Use in-memory cache with TTL of 5 minutes
    // CacheModule.register({
    //   ttl: 300000, // 5 minutes in milliseconds
    //   max: 100, // Maximum number of items in cache
    //   isGlobal: false,
    // }),
    // QuestionsModule, // Uncomment if QuestionsService is needed directly
  ],
  controllers: [AssessmentController],
  providers: [
    AssessmentService,
    // Register answer checker components
    DefaultAnswerChecker,
    McqAnswerChecker,
    TrueFalseAnswerChecker, 
    NumericalAnswerChecker,
    AnswerCheckerFactory,
  ],
  exports: [AssessmentService] // Export service if needed
})
export class AssessmentModule {}
