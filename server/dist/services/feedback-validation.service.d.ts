import { CreateRecommendationFeedbackDto } from 'src/dto/recommendation-feedback.dto';
interface PriorityScore {
    score: number;
    factors: {
        sentiment: number;
        impact: number;
        urgency: number;
        userEngagement: number;
    };
}
export declare class FeedbackValidationService {
    private readonly logger;
    private readonly COMMENT_MAX_LENGTH;
    private readonly COMMENT_BLACKLIST;
    private readonly tokenizer;
    private readonly sentimentAnalyzer;
    private readonly urgencyKeywords;
    validateAndSanitize(feedback: CreateRecommendationFeedbackDto): {
        isValid: boolean;
        sanitized: CreateRecommendationFeedbackDto;
        issues: string[];
        sentiment?: {
            score: number;
            comparative: number;
        };
        priority?: PriorityScore;
    };
    private analyzeSentiment;
    private calculateQualityScore;
    private calculatePriorityScore;
    private sanitizeComment;
    private sanitizeMetadata;
}
export {};
