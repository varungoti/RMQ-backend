import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Skill } from './entities/skill.entity';
import { AssessmentSession, AssessmentStatus } from './entities/assessment_session.entity';
import { AssessmentResponse } from './entities/assessment_response.entity';
import { AssessmentSkillScore } from './entities/assessment_skill_score.entity';
import { UserPerformanceDto, SkillPerformanceDto, AssessmentSummaryDto, UserPerformanceQueryDto } from './dto/user-performance.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Skill)
    private skillsRepository: Repository<Skill>,
    @InjectRepository(AssessmentSession)
    private sessionsRepository: Repository<AssessmentSession>,
    @InjectRepository(AssessmentResponse)
    private responsesRepository: Repository<AssessmentResponse>,
    @InjectRepository(AssessmentSkillScore)
    private scoresRepository: Repository<AssessmentSkillScore>,
  ) {}

  /**
   * Get user performance data for analytics
   * @param requestUserId The authenticated user's ID
   * @param queryParams Parameters to filter the performance data
   * @returns UserPerformanceDto with analytics data
   */
  async getUserPerformance(
    requestUserId: string,
    queryParams: UserPerformanceQueryDto,
  ): Promise<UserPerformanceDto> {
    this.logger.log(`Fetching performance data for user ${queryParams.userId || requestUserId}`);
    
    // Determine which user to fetch (self or other user if admin)
    const userId = queryParams.userId || requestUserId;

    // Find the user
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if the requesting user can access this data (self or admin)
    if (userId !== requestUserId) {
      // TODO: Implement admin check here
      // For now, assume only admins can access other users' data
      // This will be checked in the controller using RolesGuard, but we add this as a safety check
      this.logger.warn(`User ${requestUserId} attempting to access data for another user ${userId}`);
    }

    // Build where clause for sessions based on query parameters
    const where: FindOptionsWhere<AssessmentSession> = { user: { id: userId } };
    
    // Add date filters if provided
    if (queryParams.startDate && queryParams.endDate) {
      where.startedAt = Between(new Date(queryParams.startDate), new Date(queryParams.endDate));
    } else if (queryParams.startDate) {
      where.startedAt = Between(new Date(queryParams.startDate), new Date());
    } else if (queryParams.endDate) {
      where.startedAt = Between(new Date(0), new Date(queryParams.endDate));
    }

    // Get all assessment sessions for the user
    const sessions = await this.sessionsRepository.find({
      where,
      relations: ['user'],
      order: { startedAt: 'DESC' },
    });

    // Get assessment responses for calculating correctness
    const sessionIds = sessions.map(session => session.id);
    let responses: AssessmentResponse[] = [];
    
    if (sessionIds.length > 0) {
      responses = await this.responsesRepository.find({
        where: { assessmentSession: { id: In(sessionIds) } },
        relations: ['assessmentSession', 'question', 'question.primarySkill'],
      });
    }

    // Get skill scores for the user
    const skillScores = await this.scoresRepository.find({
      where: { user: { id: userId } },
      relations: ['skill', 'user'],
    });

    // Calculate skill performance metrics
    const skillPerformance = await this.calculateSkillPerformance(skillScores, responses, queryParams.skillId);
    
    // Calculate overall assessment metrics
    const assessmentCount = sessions.length;
    const completedAssessments = sessions.filter(s => s.status === AssessmentStatus.COMPLETED);
    const correctResponses = responses.filter(r => r.isCorrect).length;
    const totalResponses = responses.length;
    const overallScore = totalResponses > 0 ? (correctResponses / totalResponses) * 100 : 0;

    // Map sessions to summary DTOs for recent assessments
    const recentAssessments = sessions.slice(0, 5).map(session => {
      const sessionResponses = responses.filter(r => r.assessmentSession.id === session.id);
      const answered = sessionResponses.length;
      const correct = sessionResponses.filter(r => r.isCorrect).length;
      
      return {
        id: session.id,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        status: session.status,
        totalQuestions: session.questionIds.length,
        answeredQuestions: answered,
        correctAnswers: correct,
        percentageCorrect: answered > 0 ? (correct / answered) * 100 : 0,
      } as AssessmentSummaryDto;
    });

    // Return the complete performance DTO
    return {
      userId: user.id,
      username: user.email.split('@')[0], // Use email prefix as username since User doesn't have name
      email: user.email,
      gradeLevel: user.gradeLevel,
      overallScore,
      assessmentCount,
      skillPerformance,
      recentAssessments,
    };
  }

  /**
   * Calculate performance metrics for each skill
   * @param skillScores The skill scores for the user
   * @param responses All assessment responses to correlate with skills
   * @param filterSkillId Optional skill ID to filter results
   * @returns Array of skill performance metrics
   */
  private async calculateSkillPerformance(
    skillScores: AssessmentSkillScore[],
    responses: AssessmentResponse[],
    filterSkillId?: string,
  ): Promise<SkillPerformanceDto[]> {
    // Group skill scores by skill ID
    const scoresBySkill = new Map<string, AssessmentSkillScore[]>();
    
    skillScores.forEach(score => {
      const skillId = score.skill.id;
      if (!scoresBySkill.has(skillId)) {
        scoresBySkill.set(skillId, []);
      }
      scoresBySkill.get(skillId)!.push(score);
    });

    // If filterSkillId is provided, only process that skill
    const skillIds = filterSkillId ? [filterSkillId] : Array.from(scoresBySkill.keys());
    
    // For each skill, calculate performance metrics
    const skillPerformance: SkillPerformanceDto[] = [];
    
    for (const skillId of skillIds) {
      // Skip if we're filtering by skillId and this isn't it
      if (filterSkillId && skillId !== filterSkillId) continue;
      
      // Skip if there are no scores for this skill
      if (!scoresBySkill.has(skillId)) continue;
      
      const skillScoreArr = scoresBySkill.get(skillId)!;
      
      // Get the skill details
      const skill = await this.skillsRepository.findOneBy({ id: skillId });
      if (!skill) {
        this.logger.warn(`Skill ${skillId} not found during performance calculation`);
        continue;
      }
      
      // Calculate latest score (from the most recent assessment)
      skillScoreArr.sort((a, b) => 
        b.lastAssessedAt.getTime() - a.lastAssessedAt.getTime()
      );
      const latestScore = skillScoreArr[0];
      
      // Calculate correct/incorrect answers for this skill
      const skillResponses = responses.filter(
        r => r.question.primarySkill && r.question.primarySkill.id === skillId
      );
      const correctAnswers = skillResponses.filter(r => r.isCorrect).length;
      const incorrectAnswers = skillResponses.length - correctAnswers;

      // Get the last attempt date
      const lastAttemptDate = skillResponses.length > 0
        ? skillResponses.reduce((latest, current) => 
            latest.answeredAt > current.answeredAt ? latest : current
          ).answeredAt
        : latestScore.lastAssessedAt;
      
      // Create the skill performance DTO
      skillPerformance.push({
        skillId: skill.id,
        skillName: skill.name,
        score: latestScore.score,
        questionsAttempted: skillResponses.length,
        correctAnswers,
        incorrectAnswers,
        lastAttemptDate,
      });
    }
    
    return skillPerformance;
  }

  /**
   * Get class-wide performance metrics for administrators
   * @param gradeLevel The grade level to analyze 
   * @returns Analytics for the entire grade level
   */
  async getClassPerformance(gradeLevel: number) {
    this.logger.log(`Fetching class performance data for grade ${gradeLevel}`);
    
    // Implementation will be similar to getUserPerformance but aggregated across all users
    // in the specified grade level
    
    // This is a placeholder for future implementation
    return {
      gradeLevel,
      studentCount: 0,
      averageScore: 0,
      skillBreakdown: [],
    };
  }
} 