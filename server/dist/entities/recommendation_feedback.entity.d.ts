import { User } from './user.entity';
import { Recommendation } from './recommendation.entity';
export declare enum FeedbackType {
    HELPFUL = "helpful",
    NOT_HELPFUL = "not_helpful",
    PARTIALLY_HELPFUL = "partially_helpful",
    IRRELEVANT = "irrelevant",
    TOO_DIFFICULT = "too_difficult",
    TOO_EASY = "too_easy"
}
export declare enum FeedbackSource {
    USER = "user",
    ASSESSMENT = "assessment",
    AI = "ai",
    SYSTEM = "system"
}
export declare class RecommendationFeedback {
    id: string;
    user: User;
    userId: string;
    recommendation: Recommendation;
    recommendationId: string;
    feedbackType: FeedbackType;
    source: FeedbackSource;
    comment: string;
    impactScore: number;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
