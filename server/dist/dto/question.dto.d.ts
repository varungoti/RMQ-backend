import { QuestionType, QuestionStatus } from '../entities/question.entity';
declare class QuestionBaseDto {
    questionText: string;
    questionType: QuestionType;
    options?: Record<string, unknown>;
    correctAnswer: string;
    difficultyLevel?: number;
    gradeLevel: number;
    status?: QuestionStatus;
    imageUrl?: string;
}
export declare class CreateQuestionDto extends QuestionBaseDto {
    primarySkillId: string;
}
declare const UpdateQuestionDto_base: import("@nestjs/common").Type<Partial<CreateQuestionDto>>;
export declare class UpdateQuestionDto extends UpdateQuestionDto_base {
}
export declare class QuestionDto extends CreateQuestionDto {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
export {};
