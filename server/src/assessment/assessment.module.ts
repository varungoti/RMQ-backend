import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentService } from './assessment.service';
import { AssessmentController } from './assessment.controller';
import { AssessmentSession } from '../entities/assessment_session.entity';
import { AssessmentResponse } from '../entities/assessment_response.entity';
import { AssessmentSkillScore } from '../entities/assessment_skill_score.entity';
import { Question } from '../entities/question.entity';
import { Skill } from '../entities/skill.entity';
import { User } from '../entities/user.entity';

// Import the answer checker components
import { DefaultAnswerChecker } from './checkers/default-answer.checker';
import { McqAnswerChecker } from './checkers/mcq-answer.checker';
import { TrueFalseAnswerChecker } from './checkers/true-false-answer.checker';
import { NumericalAnswerChecker } from './checkers/numerical-answer.checker';
import { AnswerCheckerFactory } from './factories/answer-checker.factory';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssessmentSession,
      AssessmentResponse,
      AssessmentSkillScore,
      Question,
      Skill,
      User,
    ]),
  ],
  controllers: [AssessmentController],
  providers: [
    AssessmentService,
    // Register all answer checker components
    DefaultAnswerChecker,
    McqAnswerChecker,
    TrueFalseAnswerChecker,
    NumericalAnswerChecker,
    AnswerCheckerFactory,
  ],
  exports: [AssessmentService],
})
export class AssessmentModule {} 