import { User } from './user.entity';
import { Skill } from './skill.entity';
import { RecommendationResource } from './recommendation_resource.entity';
import { RecommendationPriority } from 'src/dto/recommendation.dto';
export declare class RecommendationHistory {
    id: string;
    user: User;
    skill: Skill;
    resource: RecommendationResource;
    priority: RecommendationPriority;
    userScore: number;
    targetScore: number;
    explanation: string;
    isCompleted: boolean;
    completedAt: Date;
    wasHelpful: boolean | null;
    isAiGenerated: boolean;
    createdAt: Date;
}
