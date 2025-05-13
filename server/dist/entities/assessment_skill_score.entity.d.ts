import { ValueTransformer } from 'typeorm';
import { User } from './user.entity';
import { Skill } from './skill.entity';
export declare class NumericTransformer implements ValueTransformer {
    to(data: number | null): string | null;
    from(data: string | null): number | null;
}
export declare class AssessmentSkillScore {
    id: string;
    score: number;
    level?: number;
    questionsAttempted: number;
    lastAssessedAt: Date;
    user: User;
    skill: Skill;
}
