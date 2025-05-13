import { Question } from '../../entities/question.entity';
import { AnswerChecker } from '../interfaces/answer-checker.interface';
export declare class DefaultAnswerChecker implements AnswerChecker {
    private readonly logger;
    isCorrect(question: Question, userResponse: string): boolean;
}
