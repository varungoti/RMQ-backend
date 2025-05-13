export declare class SubmitAnswerResponseDto {
    id: string;
    userResponse: string;
    isCorrect: boolean;
    answeredAt: Date;
    assessmentSession?: Record<string, any>;
    question?: Record<string, any>;
    correct?: boolean;
}
