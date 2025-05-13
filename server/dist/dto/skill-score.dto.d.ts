export declare class SkillScoreDto {
    id: string;
    userId: string;
    skillId: string;
    score: number;
    level: number;
    lastAssessedAt: Date;
}
export declare class SkillScoreUpdateDto {
    score?: number;
    level?: number;
}
