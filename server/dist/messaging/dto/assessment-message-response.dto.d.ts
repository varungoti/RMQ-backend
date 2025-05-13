export declare class AssessmentMessageResponseDto {
    success: boolean;
    message?: string;
    error?: {
        code: string;
        details: string;
    };
}
export declare class AssessmentSessionResultDto extends AssessmentMessageResponseDto {
    assessmentSessionId: string;
    score: number;
    level: number;
}
