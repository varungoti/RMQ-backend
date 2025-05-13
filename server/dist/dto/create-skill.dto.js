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
exports.UpdateSkillDto = exports.CreateSkillDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const skill_entity_1 = require("../entities/skill.entity");
class CreateSkillDto {
}
exports.CreateSkillDto = CreateSkillDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Name of the skill', maxLength: 100, example: 'Algebraic Equations' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateSkillDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Subject the skill belongs to', maxLength: 100, example: 'Mathematics' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateSkillDto.prototype, "subject", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Category within the subject', maxLength: 100, example: 'Algebra' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateSkillDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Detailed description of the skill', maxLength: 500 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateSkillDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target grade level for the skill', minimum: 1, maximum: 12, example: 9 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], CreateSkillDto.prototype, "gradeLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Status of the skill', enum: skill_entity_1.SkillStatus, default: skill_entity_1.SkillStatus.ACTIVE, example: skill_entity_1.SkillStatus.ACTIVE }),
    (0, class_validator_1.IsEnum)(skill_entity_1.SkillStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSkillDto.prototype, "status", void 0);
class UpdateSkillDto extends (0, swagger_1.PartialType)(CreateSkillDto) {
}
exports.UpdateSkillDto = UpdateSkillDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Status of the skill', enum: skill_entity_1.SkillStatus, example: skill_entity_1.SkillStatus.ACTIVE }),
    (0, class_validator_1.IsEnum)(skill_entity_1.SkillStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSkillDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Date the skill was created', example: '2024-01-01' }),
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], UpdateSkillDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Date the skill was updated', example: '2024-01-01' }),
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], UpdateSkillDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Date the skill was deleted', example: '2024-01-01' }),
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], UpdateSkillDto.prototype, "deletedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'User who created the skill', example: 'John Doe' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSkillDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'User who updated the skill', example: 'John Doe' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSkillDto.prototype, "updatedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'User who deleted the skill', example: 'John Doe' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSkillDto.prototype, "deletedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Prerequisites skills required', type: [String], example: ['Basic Arithmetic', 'Pre-Algebra'] }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateSkillDto.prototype, "prerequisites", void 0);
//# sourceMappingURL=create-skill.dto.js.map