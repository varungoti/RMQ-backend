import { Question } from '../../entities/question.entity';
import { AnswerChecker } from '../interfaces/answer-checker.interface';
export declare class NumericalAnswerChecker implements AnswerChecker {
    private readonly logger;
    private readonly DEFAULT_ABSOLUTE_TOLERANCE;
    private readonly DEFAULT_RELATIVE_TOLERANCE;
    isCorrect(question: Question, userResponse: string): boolean;
    private parseNumericalAnswer;
}
