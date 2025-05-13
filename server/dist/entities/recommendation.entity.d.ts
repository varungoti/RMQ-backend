import { User } from './user.entity';
import { Skill } from './skill.entity';
import { RecommendationResource } from './recommendation_resource.entity';
import { RecommendationPriority } from '../dto/recommendation.dto';
import { RecommendationFeedback } from './recommendation_feedback.entity';
export declare class Recommendation {
    id: string;
    user: User;
    userId: string;
    skill: Skill;
    skillId: string;
    skillName: string;
    priority: RecommendationPriority;
    score: number;
    targetScore: number;
    explanation: string;
    aiGenerated: boolean;
    resources: RecommendationResource[];
    feedback: RecommendationFeedback[];
    completed: boolean;
    completedAt: Date;
    wasHelpful: boolean;
    createdAt: Date;
    updatedAt: Date;
}
