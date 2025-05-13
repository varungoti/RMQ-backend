"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AnswerCheckerFactory_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnswerCheckerFactory = void 0;
const common_1 = require("@nestjs/common");
const question_entity_1 = require("../../entities/question.entity");
const default_answer_checker_1 = require("../checkers/default-answer.checker");
const mcq_answer_checker_1 = require("../checkers/mcq-answer.checker");
const true_false_answer_checker_1 = require("../checkers/true-false-answer.checker");
const numerical_answer_checker_1 = require("../checkers/numerical-answer.checker");
let AnswerCheckerFactory = AnswerCheckerFactory_1 = class AnswerCheckerFactory {
    constructor(defaultChecker, mcqChecker, trueFalseChecker, numericalChecker) {
        this.defaultChecker = defaultChecker;
        this.mcqChecker = mcqChecker;
        this.trueFalseChecker = trueFalseChecker;
        this.numericalChecker = numericalChecker;
        this.logger = new common_1.Logger(AnswerCheckerFactory_1.name);
    }
    getChecker(question) {
        this.logger.debug(`Getting checker for question ${question.id}, type: ${question.questionType}`);
        switch (question.questionType) {
            case question_entity_1.QuestionType.MCQ:
                return this.mcqChecker;
            case question_entity_1.QuestionType.TRUE_FALSE:
                return this.trueFalseChecker;
            case question_entity_1.QuestionType.NUMERICAL:
                return this.numericalChecker;
            default:
                this.logger.debug(`No specialized checker for type ${question.questionType}, using default`);
                return this.defaultChecker;
        }
    }
    checkAnswer(question, userResponse) {
        const checker = this.getChecker(question);
        return checker.isCorrect(question, userResponse);
    }
};
exports.AnswerCheckerFactory = AnswerCheckerFactory;
exports.AnswerCheckerFactory = AnswerCheckerFactory = AnswerCheckerFactory_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [default_answer_checker_1.DefaultAnswerChecker,
        mcq_answer_checker_1.McqAnswerChecker,
        true_false_answer_checker_1.TrueFalseAnswerChecker,
        numerical_answer_checker_1.NumericalAnswerChecker])
], AnswerCheckerFactory);
//# sourceMappingURL=answer-checker.factory.js.map