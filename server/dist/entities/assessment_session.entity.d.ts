import { User } from './user.entity';
import { AssessmentResponse } from './assessment_response.entity';
import { Skill } from './skill.entity';
export declare enum AssessmentStatus {
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare class AssessmentSession {
    id: string;
    status: AssessmentStatus;
    startedAt: Date;
    completedAt?: Date;
    overallScore?: number;
    overallLevel?: number;
    questionIds: string[];
    user: User;
    skill: Skill;
    responses: AssessmentResponse[];
}
