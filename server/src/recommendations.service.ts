import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, FindOptionsWhere, In, Not, MoreThan } from 'typeorm';
import { User } from './entities/user.entity';
import { Skill } from './entities/skill.entity';
import { AssessmentSkillScore } from './entities/assessment_skill_score.entity';
import { AssessmentSession } from './entities/assessment_session.entity';
import { AssessmentResponse } from './entities/assessment_response.entity';
import { RecommendationResource } from './entities/recommendation_resource.entity';
import { RecommendationHistory } from './entities/recommendation_history.entity';
import { RecommendationFeedback, FeedbackType, FeedbackSource } from './entities/recommendation_feedback.entity';
import { 
  RecommendationDto,
  RecommendationSetDto,
  RecommendationPriority,
  RecommendationType,
  RecommendationQueryDto,
  RecommendationResourceDto,
  RecommendationHistoryItemDto
} from './dto/recommendation.dto';
import { ConfigService } from '@nestjs/config';
import { AiRecommendationService } from './ai-recommendation.service';
import { AiGeneratedRecommendationDto } from './dto/ai-recommendation.dto';
import { RedisService } from './redis.service';
import { CreateRecommendationFeedbackDto } from './dto/recommendation-feedback.dto';
import { FeedbackValidationService } from './services/feedback-validation.service';
import { FeedbackAnalysisService } from './services/feedback-analysis.service';

// Interface for skill gap data used internally
interface SkillGap {
    skillId: string;
    score: number;
    skill: Skill;
}

interface LlmError {
  code: string;
  message: string;
  timestamp: Date;
  userId: string;
  skillId: string;
  attempt: number;
  provider: string;
}

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);
  private readonly SKILL_THRESHOLD_LOW = 550;    // Below this score, recommendations are high priority
  private readonly SKILL_THRESHOLD_CRITICAL = 450; // Below this, recommendations are critical priority
  private readonly MAX_RECOMMENDATIONS = 5;     // Maximum recommendations to return by default
  private readonly RESOURCE_COOLDOWN_DAYS = 30; // Days before a resource can be recommended again
  private readonly MAX_AI_RESOURCES_PER_SKILL = 10; // Maximum number of AI resources per skill
  private readonly AI_RESOURCE_CLEANUP_THRESHOLD = 90; // Days after which unused AI resources are cleaned up
  private readonly AI_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly AI_RETRY_ATTEMPTS = 3;
  private readonly AI_RETRY_DELAY = 1000; // 1 second
  private readonly AI_METRICS = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    totalResponseTime: 0,
    errorsByType: new Map<string, number>(),
    recentErrors: [] as LlmError[],
    maxRecentErrors: 100, // Keep last 100 errors
  };
  
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
    @InjectRepository(AssessmentSkillScore)
    private readonly scoresRepository: Repository<AssessmentSkillScore>,
    @InjectRepository(AssessmentSession)
    private readonly sessionsRepository: Repository<AssessmentSession>,
    @InjectRepository(AssessmentResponse)
    private readonly responsesRepository: Repository<AssessmentResponse>,
    @InjectRepository(RecommendationResource)
    private readonly resourcesRepository: Repository<RecommendationResource>,
    @InjectRepository(RecommendationHistory)
    private readonly historyRepository: Repository<RecommendationHistory>,
    @InjectRepository(RecommendationFeedback)
    private readonly feedbackRepository: Repository<RecommendationFeedback>,
    private readonly configService: ConfigService,
    private readonly aiRecommendationService: AiRecommendationService,
    private readonly redisService: RedisService,
    private readonly feedbackValidation: FeedbackValidationService,
    private readonly feedbackAnalysis: FeedbackAnalysisService,
  ) {}

  /**
   * Generate recommendations for a user based on their performance
   * @param userId The user to generate recommendations for
   * @param queryParams Optional filters and limits
   * @returns A set of recommendations
   */
  async getRecommendations(
    userId: string,
    queryParams: RecommendationQueryDto = {},
  ): Promise<RecommendationSetDto> {
    this.logger.log(`Generating recommendations for user ${userId} with query: ${JSON.stringify(queryParams)}`);
    
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const gapsToAddress = await this._getGapsToAddress(userId, queryParams);

    const limit = queryParams.limit || this.MAX_RECOMMENDATIONS;
    const selectedGaps = gapsToAddress.slice(0, limit);

    const validRecommendations = await this._generateRecommendationsForGaps(
        user, 
        selectedGaps, 
        queryParams
    );

    // Fetch scores needed for summary
    const latestScoreBySkill = await this._getLatestSkillScores(userId); 

    // Generate summary and progress
    const { summary, overallProgress } = this._createRecommendationSummary(
        validRecommendations, 
        latestScoreBySkill
    );

    this.logger.log(`Generated ${validRecommendations.length} recommendations for user ${userId}`);
    return {
      userId: userId,
      generatedAt: new Date(),
      recommendations: validRecommendations,
      overallProgress: overallProgress, // Use calculated progress
      summary: summary, // Use generated summary
    };
  }

  // --- Private Helper Methods --- 

  /** Fetches the latest score for each skill assessed for the user. */
  private async _getLatestSkillScores(userId: string): Promise<Map<string, AssessmentSkillScore>> {
    const skillScores = await this.scoresRepository.find({
        where: { user: { id: userId } },
        relations: ['skill', 'user'],
        order: { lastAssessedAt: 'DESC' },
    });

    const latestScoreBySkill = new Map<string, AssessmentSkillScore>();
    skillScores.forEach(score => {
        if (!score.skill) return; // Skip if skill relation is missing
        const skillId = score.skill.id;
        if (!latestScoreBySkill.has(skillId) ||
            score.lastAssessedAt > latestScoreBySkill.get(skillId)!.lastAssessedAt) {
            latestScoreBySkill.set(skillId, score);
        }
    });
    return latestScoreBySkill;
  }

  /** Identifies skill gaps based on latest scores and thresholds. */
  private _identifySkillGaps(latestScores: Map<string, AssessmentSkillScore>, filterSkillId?: string): SkillGap[] {
    const skillGaps: SkillGap[] = [];
    for (const [skillId, score] of latestScores.entries()) {
      // If a specific skill is requested, only consider that one for gap identification
      if (filterSkillId && skillId !== filterSkillId) {
          continue;
      }
      if (score.score < this.SKILL_THRESHOLD_LOW) {
        skillGaps.push({
          skillId,
          score: score.score,
          skill: score.skill // Skill relation should be loaded by _getLatestSkillScores
        });
      }
    }
    skillGaps.sort((a, b) => a.score - b.score); // Sort lowest score first
    return skillGaps;
  }

  /** Gets data for a specifically requested skill, even if not a gap. */
  private async _getSpecificSkillData(skillId: string, latestScores: Map<string, AssessmentSkillScore>): Promise<SkillGap | null> {
      const specifiedSkill = await this.skillsRepository.findOneBy({ id: skillId });
      if (!specifiedSkill) {
          this.logger.warn(`Requested skill ${skillId} not found.`);
          return null; // Return null if skill doesn't exist
      }

      const score = latestScores.get(skillId);
      return {
          skillId: skillId,
          score: score ? score.score : 500, // Use actual score or default starting score
          skill: specifiedSkill
      };
  }
  
  private async _generateSingleRecommendation(
      user: User,
      gap: SkillGap,
      queryParams: RecommendationQueryDto
  ): Promise<RecommendationDto | null> {
      let recommendation: RecommendationDto | null = null;
      const useAi = gap.score < this.SKILL_THRESHOLD_CRITICAL || queryParams.type === RecommendationType.PERSONALIZED;

      if (useAi && this.aiRecommendationService.isEnabled()) {
          // TODO: Implement AI resource lifecycle management (check for existing before creating)
          recommendation = await this._tryGenerateAiRecommendation(user, gap);
      }

      if (!recommendation) {
          recommendation = await this._findStandardRecommendation(user, gap, queryParams.type);
      }

      return recommendation;
  }

  private async _tryGenerateAiRecommendation(user: User, gap: SkillGap): Promise<RecommendationDto | null> {
    this.logger.log(`Attempting AI recommendation for user ${user.id}, skill ${gap.skillId}`);

    // 1. Check for existing AI resource for this skill
    const existingAiResource = await this.resourcesRepository.findOne({
        where: {
            relatedSkills: { id: gap.skillId },
            isAiGenerated: true,
            // Optional: Add gradeLevel: user.gradeLevel if desired
        },
        order: { createdAt: 'DESC' }, // Get the most recent one if multiple exist
        relations: ['relatedSkills'], // Load relation if needed later
    });

    if (existingAiResource) {
        this.logger.log(`Reusing existing AI resource ${existingAiResource.id} for skill ${gap.skillId}`);

        // Generate standard priority/explanation based on current score
        const { priority, explanation } = this._determinePriorityAndExplanation(gap);

        const recommendationDto: RecommendationDto = {
            id: `ai-reuse-${existingAiResource.id}`,
            skillId: gap.skillId,
            skillName: gap.skill.name, 
            priority: priority,
            score: gap.score,
            targetScore: this.SKILL_THRESHOLD_LOW + 50, // Standard target
            explanation: explanation, // Use standard explanation
            aiGenerated: true,
            resources: [{
                id: existingAiResource.id,
                title: existingAiResource.title,
                description: existingAiResource.description,
                url: existingAiResource.url,
                type: existingAiResource.type,
                estimatedTimeMinutes: existingAiResource.estimatedTimeMinutes,
                tags: existingAiResource.tags || [],
            }],
        };

        // Save the recommendation event (using existing resource) to history
        await this.saveRecommendationToHistory(user, gap.skill, existingAiResource, recommendationDto);
        return recommendationDto;

    } else {
        // 2. No existing resource found, generate a new one
        this.logger.log(`No suitable existing AI resource found for skill ${gap.skillId}. Generating new one.`);
        try {
            const history = await this._getUserAssessmentHistoryForSkill(user.id, gap.skillId);
            
            const aiRecommendation = await this.aiRecommendationService.generateRecommendation(
                user.id,
                gap.skill,
                gap.score,
                history
            );

            if (!aiRecommendation) {
                 this.logger.warn(`AI generation failed or returned null for skill ${gap.skillId}.`);
                 return null; 
            }

            // Create and save the NEW AI resource
            const newAiResource = this.resourcesRepository.create({
                title: aiRecommendation.resourceTitle,
                description: aiRecommendation.resourceDescription,
                url: aiRecommendation.resourceUrl,
                type: aiRecommendation.resourceType,
                estimatedTimeMinutes: 15, // Default time or could come from AI
                gradeLevel: user.gradeLevel,
                tags: ['ai-generated', gap.skill.name],
                relatedSkills: [gap.skill],
                isAiGenerated: true,
            });

            const savedNewResource = await this.resourcesRepository.save(newAiResource);
            this.logger.log(`Saved new AI-generated resource ${savedNewResource.id}`);
            
            // Construct DTO using the NEW resource and AI results
            const recommendationDto: RecommendationDto = {
                id: `ai-new-${savedNewResource.id}`,
                skillId: gap.skillId,
                skillName: gap.skill.name,
                priority: aiRecommendation.priority, // Use priority from AI
                score: gap.score,
                targetScore: 650, // Use target from AI or default
                explanation: aiRecommendation.explanation, // Use explanation from AI
                aiGenerated: true,
                resources: [{
                    id: savedNewResource.id,
                    title: savedNewResource.title,
                    description: savedNewResource.description,
                    url: savedNewResource.url,
                    type: savedNewResource.type,
                    estimatedTimeMinutes: savedNewResource.estimatedTimeMinutes,
                    tags: savedNewResource.tags || [],
                }],
            };
            
            // Save the new recommendation event to history
            await this.saveRecommendationToHistory(user, gap.skill, savedNewResource, recommendationDto);
            return recommendationDto;

        } catch (error) {
            this.logger.error(`Failed during *new* AI recommendation generation/saving for skill ${gap.skillId}: ${error.message}`, error.stack);
            return null; // Return null if the generation/saving process fails
        }
    }
  }

  /**
   * Enhanced standard resource selection with quality scoring and difficulty matching
   */
  private async _findStandardRecommendation(
    user: User,
    gap: SkillGap,
    requestedType?: RecommendationType,
  ): Promise<RecommendationDto | null> {
    this.logger.log(`Finding standard recommendation(s) for user ${user.id}, skill ${gap.skillId}`);
    try {
      // 1. Find resources to exclude (completed or recently viewed)
      const [completedHistory, recentHistory] = await Promise.all([
        this.historyRepository.find({
          where: {
            user: { id: user.id },
            skill: { id: gap.skillId },
            isCompleted: true,
          },
          relations: ['resource'],
          select: ['resource'],
        }),
        this.historyRepository.find({
          where: {
            user: { id: user.id },
            skill: { id: gap.skillId },
            createdAt: MoreThan(new Date(Date.now() - this.RESOURCE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000)),
          },
          relations: ['resource'],
          select: ['resource'],
        }),
      ]);

      const excludedResourceIds = new Set([
        ...completedHistory.map(h => h.resource?.id).filter((id): id is string => !!id),
        ...recentHistory.map(h => h.resource?.id).filter((id): id is string => !!id),
      ]);

      // 2. Build the main query's where clause
      const whereClause: FindOptionsWhere<RecommendationResource> = {
        relatedSkills: { id: gap.skillId },
        gradeLevel: user.gradeLevel,
        isAiGenerated: false,
      };

      if (requestedType && requestedType !== RecommendationType.PERSONALIZED) {
        whereClause.type = requestedType;
      }

      if (excludedResourceIds.size > 0) {
        whereClause.id = Not(In(Array.from(excludedResourceIds)));
      }

      // 3. Find potential resources with effectiveness metrics
      const MAX_STANDARD_OPTIONS = 10; // Increased to allow for better selection
      const potentialResources = await this.resourcesRepository.find({
        where: whereClause,
        relations: ['relatedSkills'],
        order: { createdAt: 'DESC' },
        take: MAX_STANDARD_OPTIONS,
      });

      if (potentialResources.length === 0) {
        this.logger.warn(`No suitable standard resources found for skill ${gap.skillId}, grade ${user.gradeLevel}`);
        return null;
      }

      // 4. Score and rank resources
      const scoredResources = await Promise.all(
        potentialResources.map(async (resource) => {
          const score = await this._calculateResourceScore(resource, user, gap);
          return { resource, score };
        }),
      );

      // Sort by score and take top 3
      const topResources = scoredResources
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(({ resource }) => resource);

      // 5. Select the best resource based on user's current skill level
      const selectedResource = this._selectBestResourceForSkillLevel(topResources, gap.score);

      if (!selectedResource) {
        return null;
      }

      return this._createRecommendationDto(selectedResource, gap);
    } catch (error) {
      this.logger.error(`Error finding standard recommendation: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Calculate a score for a resource based on various factors
   */
  private async _calculateResourceScore(
    resource: RecommendationResource,
    user: User,
    gap: SkillGap,
  ): Promise<number> {
    let score = 0;

    // 1. Base score from resource effectiveness
    const effectiveness = await this._getResourceEffectiveness(resource.id);
    score += effectiveness * 0.4; // 40% weight

    // 2. Difficulty matching
    const difficultyMatch = this._calculateDifficultyMatch(resource, gap.score);
    score += difficultyMatch * 0.3; // 30% weight

    // 3. Recency bonus
    const recencyBonus = this._calculateRecencyBonus(resource.createdAt);
    score += recencyBonus * 0.2; // 20% weight

    // 4. User preference bonus (if available)
    const preferenceBonus = await this._getUserPreferenceBonus(user.id, resource.type);
    score += preferenceBonus * 0.1; // 10% weight

    return score;
  }

  /**
   * Get resource effectiveness based on historical data
   */
  private async _getResourceEffectiveness(resourceId: string): Promise<number> {
    const history = await this.historyRepository.find({
      where: { resource: { id: resourceId } },
      relations: ['user', 'skill'],
    });

    if (history.length === 0) return 0.5; // Default score for new resources

    const completedCount = history.filter(h => h.isCompleted).length;
    const totalCount = history.length;
    const completionRate = completedCount / totalCount;

    // Calculate average skill improvement
    const skillImprovements = await Promise.all(
      history.map(async (h) => {
        const beforeScore = await this._getUserSkillScoreBefore(h.user.id, h.skill.id, h.createdAt);
        const afterScore = await this._getUserSkillScoreAfter(h.user.id, h.skill.id, h.createdAt);
        return afterScore - beforeScore;
      }),
    );

    const avgImprovement = skillImprovements.reduce((a, b) => a + b, 0) / skillImprovements.length;
    const normalizedImprovement = Math.min(Math.max(avgImprovement / 100, 0), 1);

    // Combine completion rate and skill improvement
    return (completionRate * 0.6 + normalizedImprovement * 0.4);
  }

  /**
   * Calculate how well a resource's difficulty matches the user's skill level
   */
  private _calculateDifficultyMatch(resource: RecommendationResource, userScore: number): number {
    // Use grade level as a proxy for difficulty since we don't have explicit difficulty
    const difficulty = resource.gradeLevel * 100; // Convert grade level to a score
    const scoreDiff = Math.abs(difficulty - userScore);
    return Math.max(0, 1 - scoreDiff / 500); // Normalize to 0-1 range
  }

  /**
   * Calculate a bonus for newer resources
   */
  private _calculateRecencyBonus(createdAt: Date): number {
    const ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - ageInDays / 365); // Linear decay over a year
  }

  /**
   * Get bonus based on user's historical preference for resource type
   */
  private async _getUserPreferenceBonus(userId: string, resourceType: RecommendationType): Promise<number> {
    const history = await this.historyRepository.find({
      where: { user: { id: userId } },
      relations: ['resource'],
    });

    if (history.length === 0) return 0.5; // Default for new users

    const typeHistory = history.filter(h => h.resource.type === resourceType);
    const completionRate = typeHistory.filter(h => h.isCompleted).length / typeHistory.length;
    return completionRate;
  }

  /**
   * Select the best resource based on user's current skill level
   */
  private _selectBestResourceForSkillLevel(
    resources: RecommendationResource[],
    userScore: number,
  ): RecommendationResource | null {
    if (resources.length === 0) return null;

    // Sort resources by how well their grade level matches the user's score
    return resources.sort((a, b) => {
      const aDiff = Math.abs(a.gradeLevel * 100 - userScore);
      const bDiff = Math.abs(b.gradeLevel * 100 - userScore);
      return aDiff - bDiff;
    })[0];
  }

  /**
   * Clean up old and unused AI-generated resources
   */
  private async _cleanupAiResources(): Promise<void> {
    const cutoffDate = new Date(Date.now() - this.AI_RESOURCE_CLEANUP_THRESHOLD * 24 * 60 * 60 * 1000);

    // Find AI resources that haven't been used recently
    const unusedResources = await this.resourcesRepository.find({
      where: {
        isAiGenerated: true,
        createdAt: LessThan(cutoffDate),
      },
      relations: ['relatedSkills'],
    });

    // Group by skill to ensure we don't delete too many resources for any skill
    const resourcesBySkill = new Map<string, RecommendationResource[]>();
    unusedResources.forEach(resource => {
      resource.relatedSkills.forEach(skill => {
        if (!resourcesBySkill.has(skill.id)) {
          resourcesBySkill.set(skill.id, []);
        }
        resourcesBySkill.get(skill.id)!.push(resource);
      });
    });

    // Delete excess resources for each skill
    for (const [skillId, resources] of resourcesBySkill) {
      const totalResources = await this.resourcesRepository.count({
        where: {
          relatedSkills: { id: skillId },
          isAiGenerated: true,
        },
      });

      if (totalResources > this.MAX_AI_RESOURCES_PER_SKILL) {
        const toDelete = resources
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .slice(0, totalResources - this.MAX_AI_RESOURCES_PER_SKILL);

        await this.resourcesRepository.remove(toDelete);
        this.logger.log(`Cleaned up ${toDelete.length} unused AI resources for skill ${skillId}`);
      }
    }
  }

  /** Determines recommendation priority and basic explanation based on score */
  private _determinePriorityAndExplanation(gap: SkillGap): { priority: RecommendationPriority; explanation: string } {
    let priority = RecommendationPriority.MEDIUM;
    let explanation = `Practice ${gap.skill.name} to improve your understanding.`;

    if (gap.score < this.SKILL_THRESHOLD_CRITICAL) {
        priority = RecommendationPriority.CRITICAL;
        explanation = `You seem to be struggling with ${gap.skill.name}. Focus on this area to build a stronger foundation.`;
    } else if (gap.score < this.SKILL_THRESHOLD_LOW) {
        priority = RecommendationPriority.HIGH;
        explanation = `Improving your skills in ${gap.skill.name} is recommended. This resource can help.`;
    }
    return { priority, explanation };
  }

   /** Fetches recent assessment response history for a specific skill. */
   private async _getUserAssessmentHistoryForSkill(userId: string, skillId: string): Promise<Array<{ skillId: string; isCorrect: boolean; date: Date }>> {
        this.logger.log(`Fetching assessment history for user ${userId}, skill ${skillId}`);
        const responses = await this.responsesRepository.find({
            where: { 
                assessmentSession: { user: { id: userId } },
                question: { primarySkill: { id: skillId } }
            },
            relations: ['question', 'question.primarySkill', 'assessmentSession', 'assessmentSession.user'],
            order: { answeredAt: 'DESC' },
            take: 10, // Limit to recent responses
        });
        
        return responses.map(response => ({
            skillId: skillId,
            isCorrect: response.isCorrect,
            date: response.answeredAt,
        }));
    }

    /** Fetches the latest score for a specific skill assessed for the user across all sessions. */
    private async _getLatestScoreForSkill(
      userId: string,
      skillId: string,
    ): Promise<AssessmentSkillScore | null> {
      this.logger.log(
        `Fetching latest score for skill ${skillId} for user ${userId}`,
      );
      // Use user and skill relations directly
      const latestScoreRecord = await this.scoresRepository.findOne({
        where: {
          user: { id: userId },
          skill: { id: skillId },
        },
        // Order by the lastAssessedAt date descending to get the latest score
        order: { lastAssessedAt: 'DESC' },
        // Ensure relations are loaded for filtering, ordering, and potential use
        relations: ['skill', 'user'],
      });

      if (!latestScoreRecord) {
        this.logger.warn(
          `No score found for skill ${skillId} for user ${userId}`,
        );
      }

      return latestScoreRecord; // Return the full entity or null
    }

  private async saveRecommendationToHistory(
    user: User,
    skill: Skill,
    resource: RecommendationResource,
    recommendation: RecommendationDto, 
  ): Promise<void> {
    try {
      // Create history entry based on RecommendationHistory entity fields
      const historyEntry = this.historyRepository.create({
        user: user, 
        skill: skill, 
        resource: resource, 
        priority: recommendation.priority, 
        explanation: recommendation.explanation, 
        userScore: recommendation.score, 
        targetScore: recommendation.targetScore, 
        isAiGenerated: recommendation.aiGenerated, 
        isCompleted: false, 
        // createdAt/completedAt/wasHelpful are set elsewhere or by DB
      });
      const savedEntry = await this.historyRepository.save(historyEntry);
      this.logger.log(`Saved recommendation (History ID: ${savedEntry.id}, Resource ID: ${resource.id}) to history for user ${user.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to save recommendation (Resource ID: ${resource.id}) to history for user ${user.id}: ${error.message}`,
        error.stack,
      );
    }
  }

  async markRecommendationCompleted(
    userId: string,
    recommendationId: string, // This is the HISTORY ID
    wasHelpful: boolean,
  ): Promise<{ success: boolean }> {
    this.logger.log(`User ${userId} marking recommendation history ${recommendationId} as completed (helpful: ${wasHelpful})`);
    
    const historyEntry = await this.historyRepository.findOne({
      where: { id: recommendationId, user: { id: userId } }, 
      relations: ['user'] 
    });

    if (!historyEntry) {
      throw new NotFoundException(`Recommendation history entry with ID ${recommendationId} not found for this user.`);
    }

    if (historyEntry.isCompleted) { // Check the correct field name
      this.logger.warn(`Recommendation history ${recommendationId} was already marked completed.`);
      return { success: true }; // Return success if already completed
    }

    historyEntry.isCompleted = true; // Update the correct field name
    historyEntry.completedAt = new Date();
    historyEntry.wasHelpful = wasHelpful; // Assuming 'wasHelpful' exists

    try {
      await this.historyRepository.save(historyEntry);
      this.logger.log(`Marked recommendation history ${recommendationId} as completed.`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to update recommendation history ${recommendationId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to mark recommendation as completed.');
    }
  }

  /**
   * Get recommendation resources - admin endpoint
   */
  async getRecommendationResources(
    type?: RecommendationType,
    gradeLevel?: number,
  ): Promise<RecommendationResourceDto[]> {
    const where: FindOptionsWhere<RecommendationResource> = {};
    
    if (type) {
      where.type = type;
    }
    
    if (gradeLevel) {
      where.gradeLevel = gradeLevel;
    }
    
    const resources = await this.resourcesRepository.find({
      where,
      relations: ['relatedSkills'],
    });
    
    return resources.map(resource => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      url: resource.url,
      type: resource.type,
      estimatedTimeMinutes: resource.estimatedTimeMinutes,
      tags: resource.tags || [],
    }));
  }

  /**
   * Create a new recommendation resource (admin only)
   */
  async createRecommendationResource(
    resourceData: Partial<RecommendationResource> & { skillIds: string[] }
  ): Promise<RecommendationResourceDto> {
    // Validate that skills exist
    const skills = await this.skillsRepository.find({
      where: { id: In(resourceData.skillIds) }
    });
    
    if (skills.length !== resourceData.skillIds.length) {
      throw new BadRequestException('One or more skill IDs are invalid');
    }
    
    // Create and save the resource
    const resource = this.resourcesRepository.create({
      title: resourceData.title,
      description: resourceData.description,
      url: resourceData.url,
      type: resourceData.type,
      estimatedTimeMinutes: resourceData.estimatedTimeMinutes,
      gradeLevel: resourceData.gradeLevel,
      tags: resourceData.tags,
      relatedSkills: skills,
      isAiGenerated: resourceData.isAiGenerated || false,
    });
    
    const savedResource = await this.resourcesRepository.save(resource);
    
    // Return the DTO
    return {
      id: savedResource.id,
      title: savedResource.title,
      description: savedResource.description,
      url: savedResource.url,
      type: savedResource.type,
      estimatedTimeMinutes: savedResource.estimatedTimeMinutes,
      tags: savedResource.tags || [],
    };
  }

  /**
   * Get a user's recommendation history with filtering and pagination
   */
  async getUserRecommendationHistory(
    userId: string,
    // Add optional parameters for filtering and pagination
    limit?: number,
    offset?: number,
    skillId?: string,
    completed?: boolean,
  ): Promise<RecommendationHistoryItemDto[]> { // Update return type
    const where: FindOptionsWhere<RecommendationHistory> = { user: { id: userId } };
    
    if (completed !== undefined) {
      where.isCompleted = completed;
    }
    // Add skill filtering to where clause
    if (skillId) {
      where.skill = { id: skillId };
    }
    
    // Validate limit and offset before applying
    const take = limit && limit > 0 ? limit : undefined; // Use undefined if invalid or not provided
    const skip = offset && offset >= 0 ? offset : undefined; // Use undefined if invalid or not provided

    this.logger.log(`Fetching history for user ${userId}: filters=(${JSON.stringify(where)}), limit=${take}, offset=${skip}`);

    const history = await this.historyRepository.find({
      where,
      relations: ['skill', 'resource'], // Ensure relations are loaded
      order: { createdAt: 'DESC' }, // Keep ordering
      take: take, // Apply limit
      skip: skip, // Apply offset
    });
    
    // Map to the DTO
    return history.map(item => ({
      id: item.id,
      skillId: item.skill.id,
      skillName: item.skill.name,
      resourceId: item.resource.id,
      resourceTitle: item.resource.title,
      priority: item.priority,
      userScore: item.userScore,
      targetScore: item.targetScore,
      isCompleted: item.isCompleted,
      completedAt: item.completedAt,
      wasHelpful: item.wasHelpful,
      createdAt: item.createdAt,
    } as RecommendationHistoryItemDto)); // Explicit type assertion can help
  }

  /**
   * Get a skill by ID
   */
  async getSkillById(skillId: string): Promise<Skill | null> {
    return this.skillsRepository.findOneBy({ id: skillId });
  }

  /**
   * Get an AI-generated explanation for a skill gap
   * Fetches necessary score and history internally.
   */
  async getAiSkillGapExplanation(
    userId: string,
    skillId: string,
  ): Promise<string> {
    this.logger.log(
      `Fetching AI explanation for skill gap: User ${userId}, Skill ${skillId}`,
    );

    const skill = await this.getSkillById(skillId);
    if (!skill) {
      throw new NotFoundException(`Skill with ID ${skillId} not found.`);
    }

    const latestScoreRecord = await this._getLatestScoreForSkill(userId, skillId);
    if (!latestScoreRecord) {
      throw new NotFoundException(
        `No assessment score found for skill ${skillId} for user ${userId}. Cannot generate explanation.`,
      );
    }
    // Explicitly extract the numeric score
    const latestScore = latestScoreRecord.score;

    const assessmentHistory = await this._getUserAssessmentHistoryForSkill(
      userId,
      skillId,
    );

    if (!assessmentHistory || assessmentHistory.length === 0) {
      this.logger.warn(
        `No assessment history found for skill ${skillId} for user ${userId}. Proceeding without history context.`,
      );
    }

    try {
      // Call the method that generates the full recommendation DTO
      const aiResult: AiGeneratedRecommendationDto | null = 
        await this.aiRecommendationService.generateRecommendation(
            userId, // Pass userId
            skill, // Pass the full Skill entity
            latestScore, // Pass the numeric score
            assessmentHistory,
        );

      if (!aiResult || !aiResult.explanation) {
        // Handle cases where AI fails or doesn't provide an explanation
        this.logger.warn(
            `AI service did not return a valid explanation for skill ${skillId}, user ${userId}.`
        );
        throw new InternalServerErrorException(
            'AI service failed to provide an explanation for the skill gap.'
        );
      }
      
      // Extract and return only the explanation string
      return aiResult.explanation;

    } catch (error) {
      this.logger.error(
        `AI service failed to generate explanation for skill ${skillId}, user ${userId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to generate AI explanation for the skill gap.',
      );
    }
  }

  private async _createAiRecommendation(
    user: User,
    gap: SkillGap,
    assessmentHistory: { skillId: string; isCorrect: boolean; date: Date }[],
  ): Promise<RecommendationDto | null> {
    this.logger.log(`Attempting AI recommendation for user ${user.id}, skill ${gap.skillId}`);

    try {
      const aiResult: AiGeneratedRecommendationDto | null = 
        await this.aiRecommendationService.generateRecommendation(
            user.id,
            gap.skill,
            gap.score,
            assessmentHistory,
        );

      if (!aiResult) {
        this.logger.warn(`AI service did not return a valid recommendation for skill ${gap.skillId}.`);
        return null;
      }

      // TODO: Check if a similar resource already exists?

      // Create and save the AI-suggested resource
      const aiResource = this.resourcesRepository.create({
        title: aiResult.resourceTitle, // Use DTO property
        description: aiResult.resourceDescription, // Use DTO property
        url: aiResult.resourceUrl, // Use DTO property
        type: aiResult.resourceType, // Use DTO property
        estimatedTimeMinutes: 15, // Default time - consider if AI should suggest this?
        gradeLevel: user.gradeLevel, // Use user's grade level
        tags: ['ai-generated', gap.skill.name], // Auto-tags
        relatedSkills: [gap.skill],
        isAiGenerated: true,
      });

      const savedResource = await this.resourcesRepository.save(aiResource);
      this.logger.log(`Saved AI generated resource ${savedResource.id}`);
      
      // Build the final RecommendationDto for the user
      const recommendationDto: RecommendationDto = {
        id: `ai-${savedResource.id}`, // ID based on the saved resource
        skillId: gap.skillId,
        skillName: gap.skill.name,
        priority: aiResult.priority, // Use DTO property
        score: gap.score,
        targetScore: 650, // Define target score - consider if AI should suggest this?
        explanation: aiResult.explanation, // Use DTO property
        aiGenerated: true,
        resources: [{
          id: savedResource.id,
          title: savedResource.title,
          description: savedResource.description,
          url: savedResource.url,
          type: savedResource.type,
          estimatedTimeMinutes: savedResource.estimatedTimeMinutes,
          tags: savedResource.tags || [],
        }],
      };
      
      // Save the recommendation event to the user's history
      await this.saveRecommendationToHistory(user, gap.skill, savedResource, recommendationDto);
      
      return recommendationDto;

    } catch (error) {
      this.logger.error(`Failed during AI recommendation generation/saving for skill ${gap.skillId}: ${error.message}`, error.stack);
      return null; // Return null if any part of the AI process fails
    }
  }

  /** 
   * Gets the list of skill gaps to generate recommendations for,
   * applying filtering based on query parameters.
   */
  private async _getGapsToAddress(
      userId: string, 
      queryParams: RecommendationQueryDto
  ): Promise<SkillGap[]> {
    const latestScoreBySkill = await this._getLatestSkillScores(userId);
    const skillGaps = this._identifySkillGaps(latestScoreBySkill, queryParams.skillId);

    let gapsToAddress = skillGaps;
    if (queryParams.skillId && !skillGaps.some(g => g.skillId === queryParams.skillId)) {
        const specificSkillData = await this._getSpecificSkillData(queryParams.skillId, latestScoreBySkill);
        if(specificSkillData) {
            gapsToAddress = [specificSkillData];
        } else {
             this.logger.log(`Requested skill ${queryParams.skillId} not found or no score available.`);
             gapsToAddress = [];
        }
    } else if (queryParams.skillId) {
        gapsToAddress = skillGaps.filter(gap => gap.skillId === queryParams.skillId);
    }
    
    return gapsToAddress;
  }

  /**
   * Generates recommendations for a given list of skill gaps.
   */
  private async _generateRecommendationsForGaps(
    user: User,
    gaps: SkillGap[],
    queryParams: RecommendationQueryDto
  ): Promise<RecommendationDto[]> {
    const recommendationPromises: Promise<RecommendationDto | null>[] = [];

    for (const gap of gaps) {
        recommendationPromises.push(
            this._generateSingleRecommendation(user, gap, queryParams)
        );
    }

    const resolvedRecommendations = await Promise.all(recommendationPromises);
    const validRecommendations = resolvedRecommendations.filter(
        (rec): rec is RecommendationDto => rec !== null
    );
    return validRecommendations;
  }

  /**
   * Calculates overall progress and generates a summary message.
   */
  private _createRecommendationSummary(
    validRecommendations: RecommendationDto[],
    latestScoreBySkill: Map<string, AssessmentSkillScore>
  ): { summary: string; overallProgress: number } {
    
    const overallScoreAverage = latestScoreBySkill.size > 0 
        ? Array.from(latestScoreBySkill.values()).reduce((sum, score) => sum + score.score, 0) / latestScoreBySkill.size
        : 500; // Default score if no scores exist
        
    // Scale average score (assumed range 400-900?) to 0-100 progress
    const overallProgress = Math.round(Math.min(100, Math.max(0, (overallScoreAverage - 400) / 4))); 

    let summary = 'Here are some recommendations based on your recent performance.';
    if (validRecommendations.length === 0) {
        summary = 'No specific recommendations at this time. Keep up the good work!';
    } else if (validRecommendations.some(r => r.priority === RecommendationPriority.CRITICAL)) {
        summary = 'You have critical skill gaps that need attention. Focus on these recommendations.';
    }
    
    return { summary, overallProgress };
  }

  /**
   * Create a recommendation DTO from a resource
   */
  private _createRecommendationDto(resource: RecommendationResource, gap: SkillGap): RecommendationDto {
    const { priority, explanation } = this._determinePriorityAndExplanation(gap);
    
    return {
      id: `std-${gap.skillId}-${Date.now()}`,
      skillId: gap.skillId,
      skillName: gap.skill.name,
      priority,
      score: gap.score,
      targetScore: this.SKILL_THRESHOLD_LOW + 50,
      explanation,
      aiGenerated: false,
      resources: [{
        id: resource.id,
        title: resource.title,
        description: resource.description,
        url: resource.url,
        type: resource.type,
        estimatedTimeMinutes: resource.estimatedTimeMinutes,
        tags: resource.tags || [],
      }],
    };
  }

  /**
   * Get user's skill score before a specific date
   */
  private async _getUserSkillScoreBefore(userId: string, skillId: string, date: Date): Promise<number> {
    const score = await this.scoresRepository.findOne({
      where: {
        user: { id: userId },
        skill: { id: skillId },
        lastAssessedAt: LessThan(date),
      },
      order: { lastAssessedAt: 'DESC' },
    });
    return score?.score || 500; // Default to middle score if no history
  }

  /**
   * Get user's skill score after a specific date
   */
  private async _getUserSkillScoreAfter(userId: string, skillId: string, date: Date): Promise<number> {
    const score = await this.scoresRepository.findOne({
      where: {
        user: { id: userId },
        skill: { id: skillId },
        lastAssessedAt: MoreThan(date),
      },
      order: { lastAssessedAt: 'ASC' },
    });
    return score?.score || 500; // Default to middle score if no history
  }

  private async _cacheAiRecommendation(userId: string, skillId: string, recommendation: RecommendationDto): Promise<void> {
    try {
      if (!this.redisService.isEnabled()) {
        return;
      }

      const cacheKey = `ai_rec:${userId}:${skillId}`;
      await this.redisService.setWithExpiry(
        cacheKey,
        JSON.stringify(recommendation),
        this.AI_CACHE_TTL,
      );
    } catch (error) {
      this.logger.warn(`Cache storage failed: ${error.message}`);
    }
  }

  private async _generateAiRecommendationWithRetry(
    user: User,
    gap: SkillGap,
    history: Array<{ skillId: string; isCorrect: boolean; date: Date }>,
  ): Promise<AiGeneratedRecommendationDto | null> {
    this.AI_METRICS.totalRequests++;
    const startTime = Date.now();
    const provider = this.aiRecommendationService.getCurrentProvider();

    try {
      for (let attempt = 1; attempt <= this.AI_RETRY_ATTEMPTS; attempt++) {
        try {
          const aiRecommendation = await this.aiRecommendationService.generateRecommendation(
            user.id,
            gap.skill,
            gap.score,
            history,
          );

          if (aiRecommendation) {
            this.AI_METRICS.successfulRequests++;
            this._updateAiMetrics(startTime);
            return aiRecommendation;
          }

          const error = {
            code: 'NULL_RESPONSE',
            message: `AI generation attempt ${attempt} returned null`,
            timestamp: new Date(),
            userId: user.id,
            skillId: gap.skillId,
            attempt,
            provider,
          };
          this._recordLlmError(error);

          this.logger.warn(
            `AI generation attempt ${attempt} returned null for skill ${gap.skillId}`,
            {
              userId: user.id,
              skillId: gap.skillId,
              attempt,
              totalAttempts: this.AI_RETRY_ATTEMPTS,
              provider,
            },
          );
        } catch (error) {
          const llmError = {
            code: error.code || 'UNKNOWN_ERROR',
            message: error.message,
            timestamp: new Date(),
            userId: user.id,
            skillId: gap.skillId,
            attempt,
            provider,
          };
          this._recordLlmError(llmError);

          this.logger.error(
            `AI generation attempt ${attempt} failed for skill ${gap.skillId}: ${error.message}`,
            {
              userId: user.id,
              skillId: gap.skillId,
              attempt,
              totalAttempts: this.AI_RETRY_ATTEMPTS,
              error: error.stack,
              provider,
            },
          );

          // Check if error is fatal and should not be retried
          if (this._isFatalAiError(error)) {
            this.AI_METRICS.failedRequests++;
            this._updateAiMetrics(startTime);
            throw error;
          }
        }

        if (attempt < this.AI_RETRY_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, this.AI_RETRY_DELAY * attempt));
        }
      }

      this.AI_METRICS.failedRequests++;
      this._updateAiMetrics(startTime);
      return null;
    } catch (error) {
      this.AI_METRICS.failedRequests++;
      this._updateAiMetrics(startTime);
      throw error;
    }
  }

  private _recordLlmError(error: LlmError): void {
    // Update error count by type
    const currentCount = this.AI_METRICS.errorsByType.get(error.code) || 0;
    this.AI_METRICS.errorsByType.set(error.code, currentCount + 1);

    // Add to recent errors, maintaining max size
    this.AI_METRICS.recentErrors.push(error);
    if (this.AI_METRICS.recentErrors.length > this.AI_METRICS.maxRecentErrors) {
      this.AI_METRICS.recentErrors.shift();
    }
  }

  private _isFatalAiError(error: any): boolean {
    // List of error types that should not be retried
    const fatalErrors = [
      'INVALID_API_KEY',
      'QUOTA_EXCEEDED',
      'INVALID_REQUEST',
      'CONTENT_POLICY_VIOLATION',
    ];

    return (
      error.code && fatalErrors.includes(error.code) ||
      error.message && fatalErrors.some(msg => error.message.includes(msg))
    );
  }

  private _updateAiMetrics(startTime: number): void {
    const responseTime = Date.now() - startTime;
    this.AI_METRICS.totalResponseTime += responseTime;
    this.AI_METRICS.averageResponseTime = 
      this.AI_METRICS.totalResponseTime / 
      (this.AI_METRICS.successfulRequests + this.AI_METRICS.failedRequests);
  }

  private async _checkAiRecommendationCache(userId: string, skillId: string): Promise<RecommendationDto | null> {
    try {
      if (!this.redisService.isEnabled()) {
        this.AI_METRICS.cacheMisses++;
        return null;
      }

      const cacheKey = `ai_rec:${userId}:${skillId}`;
      const cachedData = await this.redisService.get(cacheKey);

      if (!cachedData) {
        this.AI_METRICS.cacheMisses++;
        return null;
      }

      let recommendation: unknown;
      try {
        recommendation = JSON.parse(cachedData);
      } catch (error) {
        this.logger.warn(`Failed to parse cached data for user ${userId}, skill ${skillId}`);
        await this.redisService.del(cacheKey);
        this.AI_METRICS.cacheMisses++;
        return null;
      }
      
      if (!this._isValidRecommendationDto(recommendation)) {
        this.logger.warn(`Invalid cached recommendation data for user ${userId}, skill ${skillId}`);
        await this.redisService.del(cacheKey);
        this.AI_METRICS.cacheMisses++;
        return null;
      }

      this.AI_METRICS.cacheHits++;
      return recommendation;
    } catch (error) {
      this.logger.warn(`Cache check failed: ${error.message}`, error.stack);
      this.AI_METRICS.cacheMisses++;
      return null;
    }
  }

  private _isValidRecommendationDto(data: unknown): data is RecommendationDto {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const dto = data as Partial<RecommendationDto>;
    
    return (
      typeof dto.id === 'string' &&
      typeof dto.skillId === 'string' &&
      typeof dto.skillName === 'string' &&
      typeof dto.score === 'number' &&
      typeof dto.targetScore === 'number' &&
      typeof dto.explanation === 'string' &&
      typeof dto.aiGenerated === 'boolean' &&
      Array.isArray(dto.resources) &&
      dto.resources.length > 0 &&
      dto.resources.every(resource =>
        typeof resource.id === 'string' &&
        typeof resource.title === 'string' &&
        typeof resource.description === 'string' &&
        typeof resource.url === 'string' &&
        typeof resource.type === 'string' &&
        typeof resource.estimatedTimeMinutes === 'number' &&
        Array.isArray(resource.tags)
      )
    );
  }

  /**
   * Get current AI recommendation metrics with detailed error information
   */
  async getAiMetrics(): Promise<{
    totalRequests: number;
    successRate: number;
    cacheHitRate: number;
    averageResponseTime: number;
    errorMetrics: {
      totalErrors: number;
      errorsByType: { [key: string]: number };
      recentErrors: LlmError[];
    };
  }> {
    const totalCacheAttempts = this.AI_METRICS.cacheHits + this.AI_METRICS.cacheMisses;
    const totalRequests = this.AI_METRICS.successfulRequests + this.AI_METRICS.failedRequests;

    // Convert error map to object
    const errorsByType: { [key: string]: number } = {};
    this.AI_METRICS.errorsByType.forEach((count, code) => {
      errorsByType[code] = count;
    });

    return {
      totalRequests: this.AI_METRICS.totalRequests,
      successRate: totalRequests > 0 ? 
        (this.AI_METRICS.successfulRequests / totalRequests) * 100 : 0,
      cacheHitRate: totalCacheAttempts > 0 ? 
        (this.AI_METRICS.cacheHits / totalCacheAttempts) * 100 : 0,
      averageResponseTime: this.AI_METRICS.averageResponseTime,
      errorMetrics: {
        totalErrors: this.AI_METRICS.failedRequests,
        errorsByType,
        recentErrors: [...this.AI_METRICS.recentErrors],
      },
    };
  }

  /**
   * Add feedback for a recommendation
   */
  async addRecommendationFeedback(
    userId: string,
    recommendationId: string,
    feedbackDto: CreateRecommendationFeedbackDto,
  ): Promise<RecommendationFeedback> {
    const recommendation = await this.historyRepository.findOne({
      where: { id: recommendationId, user: { id: userId } },
    });

    if (!recommendation) {
      throw new NotFoundException('Recommendation not found');
    }

    // Validate and sanitize feedback
    const { isValid, sanitized, issues } = this.feedbackValidation.validateAndSanitize(feedbackDto);
    
    if (!isValid) {
      this.logger.warn(`Invalid feedback received: ${issues.join(', ')}`);
    }

    const feedback = this.feedbackRepository.create({
      userId,
      recommendationId,
      ...sanitized,
    });

    // Update the recommendation's wasHelpful field based on feedback type
    if (sanitized.feedbackType === FeedbackType.HELPFUL) {
      recommendation.wasHelpful = true;
    } else if (sanitized.feedbackType === FeedbackType.NOT_HELPFUL) {
      recommendation.wasHelpful = false;
    }

    await this.historyRepository.save(recommendation);
    return this.feedbackRepository.save(feedback);
  }

  /**
   * Get feedback for a recommendation
   */
  async getRecommendationFeedback(
    userId: string,
    recommendationId: string,
  ): Promise<RecommendationFeedback[]> {
    const recommendation = await this.historyRepository.findOne({
      where: { id: recommendationId, user: { id: userId } },
    });

    if (!recommendation) {
      throw new NotFoundException('Recommendation not found');
    }

    return this.feedbackRepository.find({
      where: { recommendationId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get feedback statistics for a user's recommendations
   */
  async getUserFeedbackStats(userId: string): Promise<{
    totalFeedback: number;
    feedbackByType: Record<FeedbackType, number>;
    averageImpactScore: number;
    trends: Array<{
      period: string;
      totalFeedback: number;
      helpfulPercentage: number;
      averageImpactScore: number;
      mostCommonIssues: Array<{ issue: string; count: number }>;
    }>;
    categoryAnalysis: Array<{
      category: string;
      categoryName: string;
      totalFeedback: number;
      helpfulPercentage: number;
      averageImpactScore: number;
      preferredResourceTypes: RecommendationType[];
      commonIssues: Array<{ issue: string; count: number }>;
      confidenceScore: number;
    }>;
    resourceTypeAnalysis: Array<{
      type: RecommendationType;
      totalUsage: number;
      helpfulPercentage: number;
      averageImpactScore: number;
      skillCategories: Array<{ category: string; effectiveness: number }>;
      trends: Array<{
        period: string;
        totalFeedback: number;
        helpfulPercentage: number;
        averageImpactScore: number;
        mostCommonIssues: Array<{ issue: string; count: number }>;
      }>;
    }>;
  }> {
    // Get basic feedback stats
    const feedback = await this.feedbackRepository.find({
      where: { userId },
    });

    const feedbackByType = feedback.reduce((acc, curr) => {
      acc[curr.feedbackType] = (acc[curr.feedbackType] || 0) + 1;
      return acc;
    }, {} as Record<FeedbackType, number>);

    const impactScores = feedback
      .filter(f => f.impactScore !== null)
      .map(f => f.impactScore!);

    // Get trend analysis for the last 90 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    const trends = await this.feedbackAnalysis.analyzeTrends(startDate, new Date(), 'week');

    // Get category analysis
    const categoryAnalysis = await this.feedbackAnalysis.analyzeBySkillCategory();

    // Get resource type analysis
    const resourceTypeAnalysis = await this.feedbackAnalysis.analyzeResourceTypes(90);

    return {
      totalFeedback: feedback.length,
      feedbackByType,
      averageImpactScore: impactScores.length > 0
        ? impactScores.reduce((a, b) => a + b, 0) / impactScores.length
        : 0,
      trends,
      categoryAnalysis,
      resourceTypeAnalysis,
    };
  }
} 