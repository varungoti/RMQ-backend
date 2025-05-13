import { FeedbackType, FeedbackSource } from '../entities/recommendation_feedback.entity';
export declare class CreateRecommendationFeedbackDto {
    feedbackType: FeedbackType;
    source?: FeedbackSource;
    comment?: string;
    impactScore?: number;
    metadata?: Record<string, any>;
}
export declare class RecommendationFeedbackResponseDto {
    id: string;
    userId: string;
    recommendationId: string;
    feedbackType: FeedbackType;
    source: FeedbackSource;
    comment?: string;
    impactScore?: number;
    metadata?: Record<string, any>;
    createdAt: Date;
    : any;
}
