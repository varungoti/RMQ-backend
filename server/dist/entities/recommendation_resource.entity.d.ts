import { Skill } from './skill.entity';
import { RecommendationType } from '../dto/recommendation.dto';
export declare class RecommendationResource {
    id: string;
    title: string;
    description: string;
    url: string;
    type: RecommendationType;
    estimatedTimeMinutes: number;
    gradeLevel: number;
    tags: string[];
    relatedSkills: Skill[];
    isAiGenerated: boolean;
    createdAt: Date;
    updatedAt: Date;
}
