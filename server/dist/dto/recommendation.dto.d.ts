export declare enum RecommendationType {
    PRACTICE = "practice",
    LESSON = "lesson",
    VIDEO = "video",
    INTERACTIVE = "interactive",
    PERSONALIZED = "personalized"
}
export declare enum RecommendationPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare class RecommendationQueryDto {
    userId?: string;
    limit?: number;
    type?: RecommendationType;
    skillId?: string;
}
export declare class RecommendationResourceDto {
    id: string;
    title: string;
    description: string;
    url: string;
    type: RecommendationType;
    estimatedTimeMinutes: number;
    tags: string[];
}
export declare class RecommendationDto {
    id: string;
    skillId: string;
    skillName: string;
    priority: RecommendationPriority;
    score: number;
    targetScore: number;
    explanation: string;
    aiGenerated: boolean;
    resources: RecommendationResourceDto[];
}
export declare class RecommendationSetDto {
    userId: string;
    recommendations: RecommendationDto[];
    generatedAt: Date;
    overallProgress: number;
    summary: string;
}
export declare class CreateResourceRequestDto {
    title: string;
    description: string;
    url: string;
    type: RecommendationType;
    estimatedTimeMinutes?: number;
    gradeLevel: number;
    tags?: string[];
    skillIds: string[];
}
export declare class MarkCompletedRequestDto {
    wasHelpful: boolean;
}
export declare class SkillGapExplanationRequestDto {
    skillId: string;
    score: number;
    userId?: string;
}
export declare class SkillGapExplanationResponseDto {
    explanation: string;
}
export declare class RecommendationHistoryItemDto {
    id: string;
    skillId: string;
    skillName: string;
    resourceId: string;
    resourceTitle: string;
    priority: RecommendationPriority;
    userScore: number;
    targetScore: number;
    isAiGenerated: boolean;
    isCompleted: boolean;
    completedAt?: Date;
    wasHelpful?: boolean;
    createdAt: Date;
}
