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
exports.CreateQuestionDto = void 0;
const class_validator_1 = require("class-validator");
const question_entity_1 = require("../entities/question.entity");
const swagger_1 = require("@nestjs/swagger");
class CreateQuestionDto {
}
exports.CreateQuestionDto = CreateQuestionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The main text of the question', maxLength: 1000 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "questionText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The type of the question', enum: question_entity_1.QuestionType }),
    (0, class_validator_1.IsEnum)(question_entity_1.QuestionType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "questionType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Options for multiple-choice questions (MCQ)',
        type: 'object',
        example: { a: 'Option 1', b: 'Option 2' },
        additionalProperties: true
    }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateIf)((o) => o.questionType === question_entity_1.QuestionType.MCQ),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateQuestionDto.prototype, "options", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The correct answer to the question', maxLength: 500 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "correctAnswer", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Difficulty level (1-5)', minimum: 1, maximum: 5 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateQuestionDto.prototype, "difficultyLevel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target grade level (1-12)', minimum: 1, maximum: 12 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], CreateQuestionDto.prototype, "gradeLevel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID of the primary skill this question assesses', format: 'uuid' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "primarySkillId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'URL of an optional image associated with the question' }),
    (0, class_validator_1.IsUrl)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Status of the question', enum: question_entity_1.QuestionStatus, default: question_entity_1.QuestionStatus.DRAFT }),
    (0, class_validator_1.IsEnum)(question_entity_1.QuestionStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "status", void 0);
//# sourceMappingURL=create-question.dto.js.map