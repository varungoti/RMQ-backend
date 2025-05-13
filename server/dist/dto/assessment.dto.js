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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentResponseDto = exports.GetNextQuestionResponseDto = exports.QuestionPublicDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const question_entity_1 = require("../entities/question.entity");
const skill_entity_1 = require("../entities/skill.entity");
class QuestionPublicDto {
}
exports.QuestionPublicDto = QuestionPublicDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unique identifier for the question', format: 'uuid' }),
    __metadata("design:type", String)
], QuestionPublicDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The text of the question' }),
    __metadata("design:type", String)
], QuestionPublicDto.prototype, "questionText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: question_entity_1.QuestionType, description: 'The type of question (e.g., multiple-choice)' }),
    __metadata("design:type", String)
], QuestionPublicDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Possible answer options (structure depends on question type)',
        type: 'object',
        additionalProperties: true,
        example: { 'A': 'Option A', 'B': 'Option B', 'C': 'Option C' }
    }),
    __metadata("design:type", Object)
], QuestionPublicDto.prototype, "options", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The skill this question relates to' }),
    __metadata("design:type", skill_entity_1.Skill)
], QuestionPublicDto.prototype, "skill", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Difficulty level (e.g., 1-5 or ELO)' }),
    __metadata("design:type", Number)
], QuestionPublicDto.prototype, "difficultyLevel", void 0);
class GetNextQuestionResponseDto {
}
exports.GetNextQuestionResponseDto = GetNextQuestionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Indicates if the assessment session is complete (no more questions).' }),
    __metadata("design:type", Boolean)
], GetNextQuestionResponseDto.prototype, "isComplete", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: QuestionPublicDto,
        description: 'The next question to be answered, or null if the assessment is complete. The correctAnswer field is omitted.'
    }),
    __metadata("design:type", QuestionPublicDto)
], GetNextQuestionResponseDto.prototype, "nextQuestion", void 0);
class AssessmentResponseDto {
}
exports.AssessmentResponseDto = AssessmentResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unique identifier for the assessment response', format: 'uuid' }),
    __metadata("design:type", String)
], AssessmentResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The response provided by the user' }),
    __metadata("design:type", String)
], AssessmentResponseDto.prototype, "userResponse", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the answer is correct' }),
    __metadata("design:type", Boolean)
], AssessmentResponseDto.prototype, "isCorrect", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'When the answer was submitted' }),
    __metadata("design:type", Date)
], AssessmentResponseDto.prototype, "answeredAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Time taken to answer in milliseconds' }),
    __metadata("design:type", Number)
], AssessmentResponseDto.prototype, "responseTimeMs", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The assessment session information' }),
    __metadata("design:type", Object)
], AssessmentResponseDto.prototype, "assessmentSession", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The question information' }),
    __metadata("design:type", Object)
], AssessmentResponseDto.prototype, "question", void 0);
//# sourceMappingURL=assessment.dto.js.map