"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var McqAnswerChecker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.McqAnswerChecker = void 0;
const common_1 = require("@nestjs/common");
const question_entity_1 = require("../../entities/question.entity");
let McqAnswerChecker = McqAnswerChecker_1 = class McqAnswerChecker {
    constructor() {
        this.logger = new common_1.Logger(McqAnswerChecker_1.name);
    }
    isCorrect(question, userResponse) {
        if (question.questionType !== question_entity_1.QuestionType.MCQ) {
            this.logger.warn(`McqAnswerChecker used with incompatible question type: ${question.questionType}`);
            return userResponse.toLowerCase() === question.correctAnswer.toLowerCase();
        }
        const normalizedResponse = userResponse.trim().toUpperCase();
        const normalizedCorrectAnswer = question.correctAnswer.trim().toUpperCase();
        if (!question.options) {
            this.logger.warn(`MCQ Question ${question.id} has no options defined`);
            return normalizedResponse === normalizedCorrectAnswer;
        }
        const validOptions = Object.keys(question.options);
        if (!validOptions.map(o => o.toUpperCase()).includes(normalizedResponse)) {
            this.logger.warn(`Invalid MCQ response for question ${question.id}: "${userResponse}". ` +
                `Valid options are: ${validOptions.join(', ')}`);
            return false;
        }
        const result = normalizedResponse === normalizedCorrectAnswer;
        this.logger.debug(`MCQ Check for question ${question.id}: ` +
            `User selected "${userResponse}", correct is "${question.correctAnswer}". ` +
            `Result: ${result ? 'CORRECT' : 'INCORRECT'}`);
        return result;
    }
};
exports.McqAnswerChecker = McqAnswerChecker;
exports.McqAnswerChecker = McqAnswerChecker = McqAnswerChecker_1 = __decorate([
    (0, common_1.Injectable)()
], McqAnswerChecker);
//# sourceMappingURL=mcq-answer.checker.js.map