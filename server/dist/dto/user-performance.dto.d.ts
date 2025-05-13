export declare class UserPerformanceQueryDto {
    userId?: string;
    startDate?: string;
    endDate?: string;
    gradeLevel?: number;
    skillId?: string;
}
export declare class SkillPerformanceDto {
    skillId: string;
    skillName: string;
    score: number;
    questionsAttempted: number;
    correctAnswers: number;
    incorrectAnswers: number;
    lastAttemptDate: Date;
}
export declare class AssessmentSummaryDto {
    id: string;
    startedAt: Date;
    completedAt: Date | null;
    status: string;
    totalQuestions: number;
    answeredQuestions: number;
    correctAnswers: number;
    percentageCorrect: number;
}
export declare class UserPerformanceDto {
    userId: string;
    username: string;
    email: string;
    gradeLevel: number;
    overallScore: number;
    assessmentCount: number;
    skillPerformance: SkillPerformanceDto[];
    recentAssessments: AssessmentSummaryDto[];
}
