"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var NumericalAnswerChecker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NumericalAnswerChecker = void 0;
const common_1 = require("@nestjs/common");
const question_entity_1 = require("../../entities/question.entity");
let NumericalAnswerChecker = NumericalAnswerChecker_1 = class NumericalAnswerChecker {
    constructor() {
        this.logger = new common_1.Logger(NumericalAnswerChecker_1.name);
        this.DEFAULT_ABSOLUTE_TOLERANCE = 0.001;
        this.DEFAULT_RELATIVE_TOLERANCE = 0.01;
    }
    isCorrect(question, userResponse) {
        if (question.questionType !== question_entity_1.QuestionType.NUMERICAL) {
            this.logger.warn(`NumericalAnswerChecker used with incompatible question type: ${question.questionType}`);
            return userResponse.toLowerCase() === question.correctAnswer.toLowerCase();
        }
        const options = question.options?.numericalOptions || {};
        const absoluteTolerance = options.absoluteTolerance || this.DEFAULT_ABSOLUTE_TOLERANCE;
        const relativeTolerance = options.relativeTolerance || this.DEFAULT_RELATIVE_TOLERANCE;
        const expectedUnits = options.units;
        try {
            const { value: correctValue, units: correctUnits } = this.parseNumericalAnswer(question.correctAnswer);
            const { value: userValue, units: userUnits } = this.parseNumericalAnswer(userResponse);
            if (expectedUnits && userUnits !== expectedUnits) {
                this.logger.debug(`Numerical question ${question.id}: Units mismatch. ` +
                    `Expected "${expectedUnits}", got "${userUnits || 'none'}"`);
                return false;
            }
            const absoluteDifference = Math.abs(correctValue - userValue);
            const relativeDifference = correctValue !== 0
                ? absoluteDifference / Math.abs(correctValue)
                : absoluteDifference;
            const withinAbsoluteTolerance = absoluteDifference <= absoluteTolerance;
            const withinRelativeTolerance = relativeDifference <= relativeTolerance;
            const isCorrect = withinAbsoluteTolerance || withinRelativeTolerance;
            this.logger.debug(`Numerical check for question ${question.id}: ` +
                `User: ${userValue}${userUnits || ''}, Correct: ${correctValue}${correctUnits || ''}, ` +
                `Abs diff: ${absoluteDifference}, Rel diff: ${relativeDifference * 100}%, ` +
                `Result: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
            return isCorrect;
        }
        catch (error) {
            this.logger.warn(`Error checking numerical answer for question ${question.id}: ${error.message}`);
            return false;
        }
    }
    parseNumericalAnswer(answer) {
        const cleanAnswer = answer.trim();
        const regex = /^(-?\d*\.?\d+(?:e[-+]?\d+)?)\s*(.*)$/i;
        const match = cleanAnswer.match(regex);
        if (!match) {
            throw new Error(`Invalid numerical format: "${answer}"`);
        }
        const valueStr = match[1];
        const units = match[2].trim();
        const value = parseFloat(valueStr);
        if (isNaN(value)) {
            throw new Error(`Failed to parse number: "${valueStr}"`);
        }
        return {
            value,
            units: units || undefined
        };
    }
};
exports.NumericalAnswerChecker = NumericalAnswerChecker;
exports.NumericalAnswerChecker = NumericalAnswerChecker = NumericalAnswerChecker_1 = __decorate([
    (0, common_1.Injectable)()
], NumericalAnswerChecker);
//# sourceMappingURL=numerical-answer.checker.js.map