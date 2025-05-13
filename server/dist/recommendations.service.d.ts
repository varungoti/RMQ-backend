import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Skill } from './entities/skill.entity';
import { AssessmentSkillScore } from './entities/assessment_skill_score.entity';
import { AssessmentSession } from './entities/assessment_session.entity';
import { AssessmentResponse } from './entities/assessment_response.entity';
import { RecommendationResource } from './entities/recommendation_resource.entity';
import { RecommendationHistory } from './entities/recommendation_history.entity';
import { RecommendationFeedback, FeedbackType } from './entities/recommendation_feedback.entity';
import { RecommendationSetDto, RecommendationType, RecommendationQueryDto, RecommendationResourceDto, RecommendationHistoryItemDto } from './dto/recommendation.dto';
import { ConfigService } from '@nestjs/config';
import { AiRecommendationService } from './ai-recommendation.service';
import { RedisService } from './redis.service';
import { CreateRecommendationFeedbackDto } from './dto/recommendation-feedback.dto';
import { FeedbackValidationService } from './services/feedback-validation.service';
import { FeedbackAnalysisService } from './services/feedback-analysis.service';
interface LlmError {
    code: string;
    message: string;
    timestamp: Date;
    userId: string;
    skillId: string;
    attempt: number;
    provider: string;
}
export declare class RecommendationsService {
    private readonly usersRepository;
    private readonly skillsRepository;
    private readonly scoresRepository;
    private readonly sessionsRepository;
    private readonly responsesRepository;
    private readonly resourcesRepository;
    private readonly historyRepository;
    private readonly feedbackRepository;
    private readonly configService;
    private readonly aiRecommendationService;
    private readonly redisService;
    private readonly feedbackValidation;
    private readonly feedbackAnalysis;
    private readonly logger;
    private readonly SKILL_THRESHOLD_LOW;
    private readonly SKILL_THRESHOLD_CRITICAL;
    private readonly MAX_RECOMMENDATIONS;
    private readonly RESOURCE_COOLDOWN_DAYS;
    private readonly MAX_AI_RESOURCES_PER_SKILL;
    private readonly AI_RESOURCE_CLEANUP_THRESHOLD;
    private readonly AI_CACHE_TTL;
    private readonly AI_RETRY_ATTEMPTS;
    private readonly AI_RETRY_DELAY;
    private readonly AI_METRICS;
    constructor(usersRepository: Repository<User>, skillsRepository: Repository<Skill>, scoresRepository: Repository<AssessmentSkillScore>, sessionsRepository: Repository<AssessmentSession>, responsesRepository: Repository<AssessmentResponse>, resourcesRepository: Repository<RecommendationResource>, historyRepository: Repository<RecommendationHistory>, feedbackRepository: Repository<RecommendationFeedback>, configService: ConfigService, aiRecommendationService: AiRecommendationService, redisService: RedisService, feedbackValidation: FeedbackValidationService, feedbackAnalysis: FeedbackAnalysisService);
    getRecommendations(userId: string, queryParams?: RecommendationQueryDto): Promise<RecommendationSetDto>;
    private _getLatestSkillScores;
    private _identifySkillGaps;
    private _getSpecificSkillData;
    private _generateSingleRecommendation;
    private _tryGenerateAiRecommendation;
    private _findStandardRecommendation;
    private _calculateResourceScore;
    private _getResourceEffectiveness;
    private _calculateDifficultyMatch;
    private _calculateRecencyBonus;
    private _getUserPreferenceBonus;
    private _selectBestResourceForSkillLevel;
    private _cleanupAiResources;
    private _determinePriorityAndExplanation;
    private _getUserAssessmentHistoryForSkill;
    private _getLatestScoreForSkill;
    private saveRecommendationToHistory;
    markRecommendationCompleted(userId: string, recommendationId: string, wasHelpful: boolean): Promise<{
        success: boolean;
    }>;
    getRecommendationResources(type?: RecommendationType, gradeLevel?: number): Promise<RecommendationResourceDto[]>;
    createRecommendationResource(resourceData: Partial<RecommendationResource> & {
        skillIds: string[];
    }): Promise<RecommendationResourceDto>;
    getUserRecommendationHistory(userId: string, limit?: number, offset?: number, skillId?: string, completed?: boolean): Promise<RecommendationHistoryItemDto[]>;
    getSkillById(skillId: string): Promise<Skill | null>;
    getAiSkillGapExplanation(userId: string, skillId: string): Promise<string>;
    private _createAiRecommendation;
    private _getGapsToAddress;
    private _generateRecommendationsForGaps;
    private _createRecommendationSummary;
    private _createRecommendationDto;
    private _getUserSkillScoreBefore;
    private _getUserSkillScoreAfter;
    private _cacheAiRecommendation;
    private _generateAiRecommendationWithRetry;
    private _recordLlmError;
    private _isFatalAiError;
    private _updateAiMetrics;
    private _checkAiRecommendationCache;
    private _isValidRecommendationDto;
    getAiMetrics(): Promise<{
        totalRequests: number;
        successRate: number;
        cacheHitRate: number;
        averageResponseTime: number;
        errorMetrics: {
            totalErrors: number;
            errorsByType: {
                [key: string]: number;
            };
            recentErrors: LlmError[];
        };
    }>;
    addRecommendationFeedback(userId: string, recommendationId: string, feedbackDto: CreateRecommendationFeedbackDto): Promise<RecommendationFeedback>;
    getRecommendationFeedback(userId: string, recommendationId: string): Promise<RecommendationFeedback[]>;
    getUserFeedbackStats(userId: string): Promise<{
        totalFeedback: number;
        feedbackByType: Record<FeedbackType, number>;
        averageImpactScore: number;
        trends: Array<{
            period: string;
            totalFeedback: number;
            helpfulPercentage: number;
            averageImpactScore: number;
            mostCommonIssues: Array<{
                issue: string;
                count: number;
            }>;
        }>;
        categoryAnalysis: Array<{
            category: string;
            categoryName: string;
            totalFeedback: number;
            helpfulPercentage: number;
            averageImpactScore: number;
            preferredResourceTypes: RecommendationType[];
            commonIssues: Array<{
                issue: string;
                count: number;
            }>;
            confidenceScore: number;
        }>;
        resourceTypeAnalysis: Array<{
            type: RecommendationType;
            totalUsage: number;
            helpfulPercentage: number;
            averageImpactScore: number;
            skillCategories: Array<{
                category: string;
                effectiveness: number;
            }>;
            trends: Array<{
                period: string;
                totalFeedback: number;
                helpfulPercentage: number;
                averageImpactScore: number;
                mostCommonIssues: Array<{
                    issue: string;
                    count: number;
                }>;
            }>;
        }>;
    }>;
}
export {};
