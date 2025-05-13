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
exports.QuestionDto = exports.UpdateQuestionDto = exports.CreateQuestionDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const question_entity_1 = require("../entities/question.entity");
class QuestionBaseDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The main text of the question', example: 'What is 2 + 2?' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], QuestionBaseDto.prototype, "questionText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: question_entity_1.QuestionType, description: 'Type of the question' }),
    (0, class_validator_1.IsEnum)(question_entity_1.QuestionType),
    __metadata("design:type", String)
], QuestionBaseDto.prototype, "questionType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Options for the question (structure depends on type)',
        example: { choices: ['A', 'B', 'C', 'D'] },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], QuestionBaseDto.prototype, "options", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The correct answer(s)', example: '4' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], QuestionBaseDto.prototype, "correctAnswer", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Difficulty level (e.g., 1-5 or 1-1000)',
        example: 300,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], QuestionBaseDto.prototype, "difficultyLevel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target grade level', example: 5, minimum: 1, maximum: 12 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], QuestionBaseDto.prototype, "gradeLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: question_entity_1.QuestionStatus, description: 'Status of the question', default: question_entity_1.QuestionStatus.DRAFT }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(question_entity_1.QuestionStatus),
    __metadata("design:type", String)
], QuestionBaseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'URL for an associated image' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuestionBaseDto.prototype, "imageUrl", void 0);
class CreateQuestionDto extends QuestionBaseDto {
}
exports.CreateQuestionDto = CreateQuestionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'UUID of the primary skill this question assesses' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "primarySkillId", void 0);
class UpdateQuestionDto extends (0, swagger_1.PartialType)(CreateQuestionDto) {
}
exports.UpdateQuestionDto = UpdateQuestionDto;
class QuestionDto extends CreateQuestionDto {
}
exports.QuestionDto = QuestionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unique identifier (UUID)' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QuestionDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Timestamp of creation' }),
    __metadata("design:type", Date)
], QuestionDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Timestamp of last update' }),
    __metadata("design:type", Date)
], QuestionDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=question.dto.js.map