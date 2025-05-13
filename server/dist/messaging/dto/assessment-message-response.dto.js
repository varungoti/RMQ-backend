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
exports.AssessmentSessionResultDto = exports.AssessmentMessageResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class AssessmentMessageResponseDto {
}
exports.AssessmentMessageResponseDto = AssessmentMessageResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether the operation was successful',
        example: true
    }),
    __metadata("design:type", Boolean)
], AssessmentMessageResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Optional message providing additional information',
        example: 'Assessment response processed successfully',
        required: false
    }),
    __metadata("design:type", String)
], AssessmentMessageResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Optional error details in case of failure',
        required: false
    }),
    __metadata("design:type", Object)
], AssessmentMessageResponseDto.prototype, "error", void 0);
class AssessmentSessionResultDto extends AssessmentMessageResponseDto {
}
exports.AssessmentSessionResultDto = AssessmentSessionResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The ID of the completed assessment session',
        example: 'session456'
    }),
    __metadata("design:type", String)
], AssessmentSessionResultDto.prototype, "assessmentSessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The final score of the assessment',
        example: 85
    }),
    __metadata("design:type", Number)
], AssessmentSessionResultDto.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The achieved level based on the score',
        example: 3
    }),
    __metadata("design:type", Number)
], AssessmentSessionResultDto.prototype, "level", void 0);
//# sourceMappingURL=assessment-message-response.dto.js.map