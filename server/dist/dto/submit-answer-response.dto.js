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
exports.SubmitAnswerResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class SubmitAnswerResponseDto {
}
exports.SubmitAnswerResponseDto = SubmitAnswerResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unique identifier of the answer submission' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SubmitAnswerResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User\'s response to the question' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitAnswerResponseDto.prototype, "userResponse", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the user\'s answer is correct' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SubmitAnswerResponseDto.prototype, "isCorrect", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Timestamp when the answer was submitted' }),
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], SubmitAnswerResponseDto.prototype, "answeredAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'The assessment session this answer belongs to' }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SubmitAnswerResponseDto.prototype, "assessmentSession", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'The question that was answered' }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SubmitAnswerResponseDto.prototype, "question", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Alias for isCorrect (backward compatibility)' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SubmitAnswerResponseDto.prototype, "correct", void 0);
//# sourceMappingURL=submit-answer-response.dto.js.map