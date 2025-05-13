import { Question } from '../../entities/question.entity';
export interface AnswerChecker {
    isCorrect(question: Question, userResponse: string): boolean;
}
