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
exports.StartAssessmentDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class StartAssessmentDto {
}
exports.StartAssessmentDto = StartAssessmentDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Optional: Specify the grade level for the assessment. Defaults to user\'s grade if omitted.',
        minimum: 1,
        maximum: 12,
        example: 10
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], StartAssessmentDto.prototype, "gradeLevel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Specific skill ID to assess',
        example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        format: 'uuid'
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], StartAssessmentDto.prototype, "skillId", void 0);
//# sourceMappingURL=start-assessment.dto.js.map