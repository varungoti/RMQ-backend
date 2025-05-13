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
exports.RecommendationHistoryItemDto = exports.SkillGapExplanationResponseDto = exports.SkillGapExplanationRequestDto = exports.MarkCompletedRequestDto = exports.CreateResourceRequestDto = exports.RecommendationSetDto = exports.RecommendationDto = exports.RecommendationResourceDto = exports.RecommendationQueryDto = exports.RecommendationPriority = exports.RecommendationType = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
var RecommendationType;
(function (RecommendationType) {
    RecommendationType["PRACTICE"] = "practice";
    RecommendationType["LESSON"] = "lesson";
    RecommendationType["VIDEO"] = "video";
    RecommendationType["INTERACTIVE"] = "interactive";
    RecommendationType["PERSONALIZED"] = "personalized";
})(RecommendationType || (exports.RecommendationType = RecommendationType = {}));
var RecommendationPriority;
(function (RecommendationPriority) {
    RecommendationPriority["LOW"] = "low";
    RecommendationPriority["MEDIUM"] = "medium";
    RecommendationPriority["HIGH"] = "high";
    RecommendationPriority["CRITICAL"] = "critical";
})(RecommendationPriority || (exports.RecommendationPriority = RecommendationPriority = {}));
class RecommendationQueryDto {
    constructor() {
        this.limit = 5;
    }
}
exports.RecommendationQueryDto = RecommendationQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'User ID to get recommendations for (Admin/Teacher only)', type: String, format: 'uuid' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RecommendationQueryDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Maximum number of recommendations to return', type: Number, default: 5, minimum: 1, maximum: 50 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], RecommendationQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by recommendation type', enum: RecommendationType }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(RecommendationType, { each: true }),
    __metadata("design:type", String)
], RecommendationQueryDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by specific skill ID', type: String, format: 'uuid' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RecommendationQueryDto.prototype, "skillId", void 0);
class RecommendationResourceDto {
}
exports.RecommendationResourceDto = RecommendationResourceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unique ID of the resource', format: 'uuid' }),
    __metadata("design:type", String)
], RecommendationResourceDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Title of the resource' }),
    __metadata("design:type", String)
], RecommendationResourceDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Description of the resource' }),
    __metadata("design:type", String)
], RecommendationResourceDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'URL of the resource', format: 'url' }),
    __metadata("design:type", String)
], RecommendationResourceDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Type of resource', enum: RecommendationType }),
    __metadata("design:type", String)
], RecommendationResourceDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Estimated time to complete in minutes' }),
    __metadata("design:type", Number)
], RecommendationResourceDto.prototype, "estimatedTimeMinutes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Associated tags', type: [String] }),
    __metadata("design:type", Array)
], RecommendationResourceDto.prototype, "tags", void 0);
class RecommendationDto {
}
exports.RecommendationDto = RecommendationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unique ID of the recommendation instance (can be composite)' }),
    __metadata("design:type", String)
], RecommendationDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID of the skill being addressed', format: 'uuid' }),
    __metadata("design:type", String)
], RecommendationDto.prototype, "skillId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Name of the skill being addressed' }),
    __metadata("design:type", String)
], RecommendationDto.prototype, "skillName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Priority of the recommendation', enum: RecommendationPriority }),
    __metadata("design:type", String)
], RecommendationDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User score for the skill at the time of recommendation' }),
    __metadata("design:type", Number)
], RecommendationDto.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target score for the skill' }),
    __metadata("design:type", Number)
], RecommendationDto.prototype, "targetScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Explanation for the recommendation' }),
    __metadata("design:type", String)
], RecommendationDto.prototype, "explanation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Flag indicating if generated by AI' }),
    __metadata("design:type", Boolean)
], RecommendationDto.prototype, "aiGenerated", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'List of recommended resources', type: [RecommendationResourceDto] }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RecommendationResourceDto),
    __metadata("design:type", Array)
], RecommendationDto.prototype, "resources", void 0);
class RecommendationSetDto {
}
exports.RecommendationSetDto = RecommendationSetDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID the recommendations belong to', format: 'uuid' }),
    __metadata("design:type", String)
], RecommendationSetDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'List of recommendations', type: [RecommendationDto] }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RecommendationDto),
    __metadata("design:type", Array)
], RecommendationSetDto.prototype, "recommendations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Timestamp when the recommendations were generated' }),
    __metadata("design:type", Date)
], RecommendationSetDto.prototype, "generatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Overall learning progress percentage for related skills', example: 75, minimum: 0, maximum: 100 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], RecommendationSetDto.prototype, "overallProgress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Summary of the recommendation set', example: 'Focus on improving equation solving skills.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecommendationSetDto.prototype, "summary", void 0);
class CreateResourceRequestDto {
}
exports.CreateResourceRequestDto = CreateResourceRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Resource title', example: 'Practice Worksheet: Equations' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateResourceRequestDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Resource description', example: '10 practice problems on solving linear equations.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateResourceRequestDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Link to the resource', example: 'https://example.com/worksheet/456' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateResourceRequestDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Type of the recommendation resource', enum: RecommendationType, example: RecommendationType.PRACTICE }),
    (0, class_validator_1.IsEnum)(RecommendationType),
    __metadata("design:type", String)
], CreateResourceRequestDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Estimated time to complete in minutes', example: 20 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateResourceRequestDto.prototype, "estimatedTimeMinutes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target grade level for the resource', example: 8 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateResourceRequestDto.prototype, "gradeLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Metadata tags', type: [String], example: ['algebra', 'practice', 'grade-8'] }),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateResourceRequestDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'List of Skill IDs this resource addresses', type: [String], format: 'uuid' }),
    (0, class_validator_1.IsUUID)('all', { each: true }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateResourceRequestDto.prototype, "skillIds", void 0);
class MarkCompletedRequestDto {
}
exports.MarkCompletedRequestDto = MarkCompletedRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the recommendation was helpful' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], MarkCompletedRequestDto.prototype, "wasHelpful", void 0);
class SkillGapExplanationRequestDto {
}
exports.SkillGapExplanationRequestDto = SkillGapExplanationRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID of the skill to explain the gap for', format: 'uuid' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SkillGapExplanationRequestDto.prototype, "skillId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "The user's current score for the skill", example: 55 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], SkillGapExplanationRequestDto.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Target User ID (for Admin/Teacher use)', format: 'uuid' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SkillGapExplanationRequestDto.prototype, "userId", void 0);
class SkillGapExplanationResponseDto {
}
exports.SkillGapExplanationResponseDto = SkillGapExplanationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The generated explanation for the skill gap.', example: 'To improve from 55, focus on practice problems involving multi-step equations.' }),
    __metadata("design:type", String)
], SkillGapExplanationResponseDto.prototype, "explanation", void 0);
class RecommendationHistoryItemDto {
}
exports.RecommendationHistoryItemDto = RecommendationHistoryItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'History entry unique ID', format: 'uuid' }),
    __metadata("design:type", String)
], RecommendationHistoryItemDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID of the associated skill', format: 'uuid' }),
    __metadata("design:type", String)
], RecommendationHistoryItemDto.prototype, "skillId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Name of the associated skill', example: 'Solving Quadratic Equations' }),
    __metadata("design:type", String)
], RecommendationHistoryItemDto.prototype, "skillName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID of the recommended resource', format: 'uuid' }),
    __metadata("design:type", String)
], RecommendationHistoryItemDto.prototype, "resourceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Title of the recommended resource', example: 'Video: Factoring Quadratics' }),
    __metadata("design:type", String)
], RecommendationHistoryItemDto.prototype, "resourceTitle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Priority of the recommendation when given', enum: RecommendationPriority }),
    __metadata("design:type", String)
], RecommendationHistoryItemDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User score at the time of recommendation' }),
    __metadata("design:type", Number)
], RecommendationHistoryItemDto.prototype, "userScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target score for the recommendation' }),
    __metadata("design:type", Number)
], RecommendationHistoryItemDto.prototype, "targetScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Was the recommendation AI generated?' }),
    __metadata("design:type", Boolean)
], RecommendationHistoryItemDto.prototype, "isAiGenerated", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Has the user marked this recommendation as completed?' }),
    __metadata("design:type", Boolean)
], RecommendationHistoryItemDto.prototype, "isCompleted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Timestamp when the recommendation was marked completed' }),
    __metadata("design:type", Date)
], RecommendationHistoryItemDto.prototype, "completedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Did the user find this recommendation helpful?' }),
    __metadata("design:type", Boolean)
], RecommendationHistoryItemDto.prototype, "wasHelpful", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Timestamp when the recommendation was created' }),
    __metadata("design:type", Date)
], RecommendationHistoryItemDto.prototype, "createdAt", void 0);
//# sourceMappingURL=recommendation.dto.js.map