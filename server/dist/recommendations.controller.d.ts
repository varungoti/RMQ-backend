import { RecommendationsService } from './recommendations.service';
import { RecommendationSetDto, RecommendationQueryDto, RecommendationType, RecommendationResourceDto, MarkCompletedRequestDto, CreateResourceRequestDto, SkillGapExplanationResponseDto, RecommendationHistoryItemDto } from './dto/recommendation.dto';
import { CreateRecommendationFeedbackDto, RecommendationFeedbackResponseDto } from './dto/recommendation-feedback.dto';
import { LlmFactoryService } from './llm/llm-factory.service';
import { LlmProviderType } from './dto/llm-provider.dto';
import { AiRecommendationService } from './ai-recommendation.service';
import { AiMetricsService } from './metrics/ai-metrics.service';
declare class SimpleSuccessResponseDto {
    success: boolean;
    message?: string;
}
declare class LlmInfoProviderDto {
    type: LlmProviderType;
    enabled: boolean;
    model: string;
}
declare class LlmInfoResponseDto {
    defaultProvider: LlmProviderType;
    availableProviders: LlmInfoProviderDto[];
}
declare class SelectLlmRequestDto {
    provider: LlmProviderType;
}
declare class CacheStatsMetricsDto {
    hits: number;
    misses: number;
    hitRate: number;
    evictions: number;
}
declare class CacheStatsResponseDto {
    enabled: boolean;
    size: number;
    maxSize: number;
    ttlSeconds: number;
    metrics: CacheStatsMetricsDto;
}
declare class UpdateLlmConfigRequestDto {
    provider: LlmProviderType;
    model?: string;
    temperature?: number;
    apiKey?: string;
    enabled?: boolean;
    endpoint?: string;
}
declare class UpdateConfigResponseCacheDto {
    invalidated: boolean;
}
declare class UpdateConfigResponseDto {
    success: boolean;
    message: string;
    cache: UpdateConfigResponseCacheDto;
}
declare class AiErrorMetricsDto {
    totalErrors: number;
    errorsByType: {
        [key: string]: number;
    };
    recentErrors: Array<{
        code: string;
        message: string;
        timestamp: Date;
        userId: string;
        skillId: string;
        attempt: number;
        provider: string;
    }>;
}
declare class AiMetricsResponseDto {
    totalRequests: number;
    successRate: number;
    cacheHitRate: number;
    averageResponseTime: number;
    errorMetrics: AiErrorMetricsDto;
}
declare class LlmValidationErrorDto {
    code: string;
    message: string;
    details: any[];
    rawResponse: any;
}
declare class LlmParseErrorDto {
    code: string;
    message: string;
    response: string;
}
declare class LlmMetricsResponseDto {
    totalAttempts: number;
    validResponses: number;
    invalidResponses: number;
    averageAttempts: number;
    validationErrors: LlmValidationErrorDto[];
    parseErrors: LlmParseErrorDto[];
}
export declare class RecommendationsController {
    private readonly recommendationsService;
    private readonly llmFactory;
    private readonly aiRecommendationService;
    private readonly aiMetrics;
    private readonly logger;
    constructor(recommendationsService: RecommendationsService, llmFactory: LlmFactoryService, aiRecommendationService: AiRecommendationService, aiMetrics: AiMetricsService);
    getRecommendations(req: any, queryParams: RecommendationQueryDto): Promise<RecommendationSetDto>;
    markRecommendationCompleted(req: any, recommendationId: string, body: MarkCompletedRequestDto): Promise<SimpleSuccessResponseDto>;
    getRecommendationHistory(req: any, limit?: number, offset?: number, skillId?: string, completed?: boolean): Promise<RecommendationHistoryItemDto[]>;
    getRecommendationResources(skillId?: string, type?: RecommendationType, gradeLevel?: number): Promise<RecommendationResourceDto[]>;
    createRecommendationResource(req: any, createDto: CreateResourceRequestDto): Promise<RecommendationResourceDto>;
    getLlmInfo(): Promise<LlmInfoResponseDto>;
    selectLlmProvider(req: any, body: SelectLlmRequestDto): Promise<SimpleSuccessResponseDto>;
    getLlmCacheStats(): Promise<CacheStatsResponseDto>;
    clearLlmCache(): Promise<SimpleSuccessResponseDto>;
    resetLlmCacheMetrics(): Promise<SimpleSuccessResponseDto>;
    updateLlmConfig(body: UpdateLlmConfigRequestDto): Promise<UpdateConfigResponseDto>;
    getAiSkillGapExplanation(req: any, skillId: string): Promise<SkillGapExplanationResponseDto | null>;
    getAiMetrics(): Promise<AiMetricsResponseDto>;
    resetAiMetrics(): Promise<SimpleSuccessResponseDto>;
    getLlmMetrics(): Promise<LlmMetricsResponseDto>;
    resetLlmMetrics(): Promise<SimpleSuccessResponseDto>;
    addRecommendationFeedback(req: any, recommendationId: string, feedbackDto: CreateRecommendationFeedbackDto): Promise<RecommendationFeedbackResponseDto>;
    getRecommendationFeedback(req: any, recommendationId: string): Promise<RecommendationFeedbackResponseDto[]>;
    getUserFeedbackStats(req: any): Promise<{
        totalFeedback: number;
        feedbackByType: Record<string, number>;
        averageImpactScore: number;
    }>;
}
export {};
