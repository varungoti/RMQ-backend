import { Repository } from 'typeorm';
import { RedisService } from '../redis.service';
import { RecommendationFeedback, FeedbackType } from 'src/entities/recommendation_feedback.entity';
import { RecommendationType } from 'src/dto/recommendation.dto';
interface AiPerformanceMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    cacheHits: number;
    cacheMisses: number;
    errorsByType: Record<string, number>;
    recentErrors: Array<{
        code: string;
        message: string;
        timestamp: Date;
        userId: string;
        skillId: string;
        attempt: number;
        provider: string;
    }>;
    successRate?: number;
    cacheHitRate?: number;
    feedback?: {
        totalFeedback: number;
        feedbackByType: Record<FeedbackType, number>;
        resourceTypeEffectiveness: Record<RecommendationType, {
            total: number;
            helpful: number;
            notHelpful: number;
            effectiveness: number;
        }>;
        averageImpactScore: number;
        commonIssues: Array<{
            issue: string;
            count: number;
        }>;
    };
}
export declare class AiMetricsService {
    private readonly redisService;
    private readonly feedbackRepository;
    private readonly logger;
    private readonly METRICS_KEY;
    private readonly MAX_RECENT_ERRORS;
    private readonly MAX_COMMON_ISSUES;
    private metrics;
    constructor(redisService: RedisService, feedbackRepository: Repository<RecommendationFeedback>);
    private loadMetrics;
    private saveMetrics;
    private startPeriodicFeedbackAnalysis;
    private updateFeedbackMetrics;
    recordRequest(success: boolean, responseTime: number, fromCache: boolean, error?: {
        code: string;
        message: string;
        userId: string;
        skillId: string;
        attempt: number;
        provider: string;
    }): Promise<void>;
    getMetrics(): Promise<AiPerformanceMetrics>;
    resetMetrics(): Promise<void>;
}
export {};
