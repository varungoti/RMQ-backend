import { Question } from './question.entity';
import { AssessmentSkillScore } from './assessment_skill_score.entity';
export declare enum SkillStatus {
    ACTIVE = "active",
    INACTIVE = "inactive"
}
export declare class Skill {
    id: string;
    name: string;
    subject: string;
    category?: string;
    description?: string;
    gradeLevel: number;
    createdAt: Date;
    updatedAt: Date;
    status: SkillStatus;
    imageUrl?: string;
    isPrimary: boolean;
    isSecondary: boolean;
    questions: Question[];
    skillScores: AssessmentSkillScore[];
    secondarySkills: Skill[];
    primarySkills: Skill[];
}
