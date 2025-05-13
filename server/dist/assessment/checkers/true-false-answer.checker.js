"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TrueFalseAnswerChecker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrueFalseAnswerChecker = void 0;
const common_1 = require("@nestjs/common");
const question_entity_1 = require("../../entities/question.entity");
let TrueFalseAnswerChecker = TrueFalseAnswerChecker_1 = class TrueFalseAnswerChecker {
    constructor() {
        this.logger = new common_1.Logger(TrueFalseAnswerChecker_1.name);
        this.trueValues = ['true', 't', 'yes', 'y', '1'];
        this.falseValues = ['false', 'f', 'no', 'n', '0'];
    }
    isCorrect(question, userResponse) {
        if (question.questionType !== question_entity_1.QuestionType.TRUE_FALSE) {
            this.logger.warn(`TrueFalseAnswerChecker used with incompatible question type: ${question.questionType}`);
            return userResponse.toLowerCase() === question.correctAnswer.toLowerCase();
        }
        const normalizedResponse = userResponse.toLowerCase().trim();
        let userBooleanResponse = null;
        if (this.trueValues.includes(normalizedResponse)) {
            userBooleanResponse = true;
        }
        else if (this.falseValues.includes(normalizedResponse)) {
            userBooleanResponse = false;
        }
        else {
            this.logger.warn(`Invalid TRUE/FALSE response for question ${question.id}: "${userResponse}". ` +
                `Valid values are: true/false, t/f, yes/no, y/n, 1/0`);
            return false;
        }
        const correctAnswerLower = question.correctAnswer.toLowerCase().trim();
        const correctBooleanAnswer = this.trueValues.includes(correctAnswerLower);
        const result = userBooleanResponse === correctBooleanAnswer;
        this.logger.debug(`TRUE/FALSE Check for question ${question.id}: ` +
            `User responded "${userResponse}" (${userBooleanResponse}), ` +
            `correct is "${question.correctAnswer}" (${correctBooleanAnswer}). ` +
            `Result: ${result ? 'CORRECT' : 'INCORRECT'}`);
        return result;
    }
};
exports.TrueFalseAnswerChecker = TrueFalseAnswerChecker;
exports.TrueFalseAnswerChecker = TrueFalseAnswerChecker = TrueFalseAnswerChecker_1 = __decorate([
    (0, common_1.Injectable)()
], TrueFalseAnswerChecker);
//# sourceMappingURL=true-false-answer.checker.js.map