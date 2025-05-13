import { Question } from '../../entities/question.entity';
import { AnswerChecker } from '../interfaces/answer-checker.interface';
export declare class TrueFalseAnswerChecker implements AnswerChecker {
    private readonly logger;
    private readonly trueValues;
    private readonly falseValues;
    isCorrect(question: Question, userResponse: string): boolean;
}
