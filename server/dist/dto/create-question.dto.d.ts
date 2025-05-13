import { QuestionType, QuestionStatus } from '../entities/question.entity';
export declare class CreateQuestionDto {
    questionText: string;
    questionType: QuestionType;
    options?: Record<string, unknown>;
    correctAnswer: string;
    difficultyLevel?: number;
    gradeLevel: number;
    primarySkillId: string;
    imageUrl?: string;
    status?: QuestionStatus;
}
