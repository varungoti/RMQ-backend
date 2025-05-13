import { RecommendationType, RecommendationPriority } from './recommendation.dto';
export declare class AiGeneratedRecommendationDto {
    explanation: string;
    resourceTitle: string;
    resourceDescription: string;
    resourceType: RecommendationType;
    resourceUrl: string;
    priority: RecommendationPriority;
}
