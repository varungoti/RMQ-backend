interface User {
    id: string;
    email: string;
    name?: string;
}
interface AssessmentResult {
    sessionId: string;
    studentId: string;
    overallLevel: 1 | 2 | 3 | 4;
    skillScores: Record<string, {
        level: 1 | 2 | 3 | 4;
        notes?: string;
    }>;
    cognitiveScores: Record<string, {
        level: 1 | 2 | 3 | 4;
        notes?: string;
    }>;
    diagnosticInsights?: string[];
    recommendations?: string[];
    timestamp: Date;
}
interface Skill {
    id: string;
    name: string;
    subject: 'Math' | 'English' | 'Science' | 'Cognitive';
    description?: string;
}

export type { AssessmentResult, Skill, User };
