import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { LlmFactoryService } from './llm/llm-factory.service';
import { Skill } from './entities/skill.entity';
import { AiGeneratedRecommendationDto } from './dto/ai-recommendation.dto';
import { ValidationError } from 'class-validator';
import { AiMetricsService } from './metrics/ai-metrics.service';
import { RecommendationFeedback } from './entities/recommendation_feedback.entity';
interface LlmValidationError {
    code: string;
    message: string;
    details: ValidationError[];
    rawResponse: any;
}
interface LlmResponseMetrics {
    validationErrors: LlmValidationError[];
    parseErrors: Array<{
        code: string;
        message: string;
        response: string;
    }>;
    totalAttempts: number;
    validResponses: number;
    invalidResponses: number;
    averageAttempts: number;
}
export declare class AiRecommendationService {
    private configService;
    private llmFactory;
    private aiMetrics;
    private readonly feedbackRepository;
    private readonly logger;
    private readonly useAiRecommendations;
    private readonly metrics;
    private readonly MAX_VALIDATION_ERRORS;
    private readonly MAX_PARSE_ERRORS;
    constructor(configService: ConfigService, llmFactory: LlmFactoryService, aiMetrics: AiMetricsService, feedbackRepository: Repository<RecommendationFeedback>);
    isEnabled(): boolean;
    getCurrentProvider(): string;
    getMetrics(): LlmResponseMetrics;
    resetMetrics(): void;
    generateRecommendation(userId: string, skill: Skill, score: number, assessmentHistory: {
        skillId: string;
        isCorrect: boolean;
        date: Date;
    }[]): Promise<AiGeneratedRecommendationDto | null>;
    private _generateSystemPrompt;
    private _generatePrompt;
    private _parseResponse;
    private _validateResponse;
    private _recordValidationError;
    private _recordParseError;
    private _getFeedbackHistory;
    private _analyzeFeedbackHistory;
}
export {};
