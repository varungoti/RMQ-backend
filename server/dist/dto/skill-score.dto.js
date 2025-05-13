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
exports.SkillScoreUpdateDto = exports.SkillScoreDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class SkillScoreDto {
}
exports.SkillScoreDto = SkillScoreDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unique identifier for the skill score record', example: 'a1b2c3d4-...' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SkillScoreDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID of the associated user', example: 'e5f6g7h8-...' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SkillScoreDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID of the assessed skill', example: 'i9j0k1l2-...' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SkillScoreDto.prototype, "skillId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Score obtained for the skill', example: 85 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SkillScoreDto.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Assessment level achieved', example: 3 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SkillScoreDto.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Timestamp when the score was last updated' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], SkillScoreDto.prototype, "lastAssessedAt", void 0);
class SkillScoreUpdateDto {
}
exports.SkillScoreUpdateDto = SkillScoreUpdateDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Score obtained for the skill', example: 90, required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SkillScoreUpdateDto.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Assessment level achieved', example: 4, required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SkillScoreUpdateDto.prototype, "level", void 0);
//# sourceMappingURL=skill-score.dto.js.map