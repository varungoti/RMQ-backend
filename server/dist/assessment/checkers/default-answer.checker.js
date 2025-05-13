"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DefaultAnswerChecker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultAnswerChecker = void 0;
const common_1 = require("@nestjs/common");
let DefaultAnswerChecker = DefaultAnswerChecker_1 = class DefaultAnswerChecker {
    constructor() {
        this.logger = new common_1.Logger(DefaultAnswerChecker_1.name);
    }
    isCorrect(question, userResponse) {
        this.logger.debug(`DefaultAnswerChecker: Comparing answer for question ${question.id}. ` +
            `User response: "${userResponse}", Correct answer: "${question.correctAnswer}"`);
        return userResponse.toLowerCase() === question.correctAnswer.toLowerCase();
    }
};
exports.DefaultAnswerChecker = DefaultAnswerChecker;
exports.DefaultAnswerChecker = DefaultAnswerChecker = DefaultAnswerChecker_1 = __decorate([
    (0, common_1.Injectable)()
], DefaultAnswerChecker);
//# sourceMappingURL=default-answer.checker.js.map