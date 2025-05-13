import { Question } from '../../entities/question.entity';
import { AnswerChecker } from '../interfaces/answer-checker.interface';
import { DefaultAnswerChecker } from '../checkers/default-answer.checker';
import { McqAnswerChecker } from '../checkers/mcq-answer.checker';
import { TrueFalseAnswerChecker } from '../checkers/true-false-answer.checker';
import { NumericalAnswerChecker } from '../checkers/numerical-answer.checker';
export declare class AnswerCheckerFactory {
    private readonly defaultChecker;
    private readonly mcqChecker;
    private readonly trueFalseChecker;
    private readonly numericalChecker;
    private readonly logger;
    constructor(defaultChecker: DefaultAnswerChecker, mcqChecker: McqAnswerChecker, trueFalseChecker: TrueFalseAnswerChecker, numericalChecker: NumericalAnswerChecker);
    getChecker(question: Question): AnswerChecker;
    checkAnswer(question: Question, userResponse: string): boolean;
}
