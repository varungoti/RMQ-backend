import { QuestionType } from '../entities/question.entity';
import { Skill } from '../entities/skill.entity';
export declare class QuestionPublicDto {
    id: string;
    questionText: string;
    type: QuestionType;
    options?: Record<string, unknown>;
    skill: Skill;
    difficultyLevel?: number;
}
export declare class GetNextQuestionResponseDto {
    isComplete: boolean;
    nextQuestion: QuestionPublicDto | null;
}
export declare class AssessmentResponseDto {
    id: string;
    userResponse: string;
    isCorrect: boolean;
    answeredAt: Date;
    responseTimeMs?: number;
    assessmentSession: {
        id: string;
        status: string;
    };
    question: {
        id: string;
        questionText: string;
        questionType: string;
        options?: Record<string, unknown>;
        difficultyLevel?: number;
    };
}
