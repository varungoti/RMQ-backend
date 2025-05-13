import { AssessmentSession } from './assessment_session.entity';
import { AssessmentSkillScore } from './assessment_skill_score.entity';
export declare enum UserRole {
    STUDENT = "student",
    PARENT = "parent",
    TEACHER = "teacher",
    ADMIN = "admin"
}
export declare class User {
    id: string;
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
    gradeLevel: number;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
    assessmentSessions: AssessmentSession[];
    skillScores: AssessmentSkillScore[];
}
