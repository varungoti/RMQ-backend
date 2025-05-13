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
exports.UserPerformanceDto = exports.AssessmentSummaryDto = exports.SkillPerformanceDto = exports.UserPerformanceQueryDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class UserPerformanceQueryDto {
}
exports.UserPerformanceQueryDto = UserPerformanceQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Target User ID (Admin/Teacher only)', format: 'uuid' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UserPerformanceQueryDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter start date (ISO 8601 format)', example: '2023-01-01T00:00:00Z' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UserPerformanceQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter end date (ISO 8601 format)', example: '2023-12-31T23:59:59Z' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UserPerformanceQueryDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by grade level', minimum: 1, maximum: 12, example: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UserPerformanceQueryDto.prototype, "gradeLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by specific skill ID', format: 'uuid' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UserPerformanceQueryDto.prototype, "skillId", void 0);
class SkillPerformanceDto {
}
exports.SkillPerformanceDto = SkillPerformanceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID of the skill', format: 'uuid' }),
    __metadata("design:type", String)
], SkillPerformanceDto.prototype, "skillId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Name of the skill' }),
    __metadata("design:type", String)
], SkillPerformanceDto.prototype, "skillName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Latest calculated score for the skill' }),
    __metadata("design:type", Number)
], SkillPerformanceDto.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total number of questions attempted for this skill' }),
    __metadata("design:type", Number)
], SkillPerformanceDto.prototype, "questionsAttempted", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of correct answers for this skill' }),
    __metadata("design:type", Number)
], SkillPerformanceDto.prototype, "correctAnswers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of incorrect answers for this skill' }),
    __metadata("design:type", Number)
], SkillPerformanceDto.prototype, "incorrectAnswers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date of the last attempt for this skill' }),
    __metadata("design:type", Date)
], SkillPerformanceDto.prototype, "lastAttemptDate", void 0);
class AssessmentSummaryDto {
}
exports.AssessmentSummaryDto = AssessmentSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID of the assessment session', format: 'uuid' }),
    __metadata("design:type", String)
], AssessmentSummaryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Timestamp when the assessment started' }),
    __metadata("design:type", Date)
], AssessmentSummaryDto.prototype, "startedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Timestamp when the assessment was completed (null if in progress)' }),
    __metadata("design:type", Date)
], AssessmentSummaryDto.prototype, "completedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Current status of the assessment (e.g., IN_PROGRESS, COMPLETED)' }),
    __metadata("design:type", String)
], AssessmentSummaryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total number of questions in the assessment' }),
    __metadata("design:type", Number)
], AssessmentSummaryDto.prototype, "totalQuestions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of questions answered so far' }),
    __metadata("design:type", Number)
], AssessmentSummaryDto.prototype, "answeredQuestions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of questions answered correctly' }),
    __metadata("design:type", Number)
], AssessmentSummaryDto.prototype, "correctAnswers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Percentage of correctly answered questions' }),
    __metadata("design:type", Number)
], AssessmentSummaryDto.prototype, "percentageCorrect", void 0);
class UserPerformanceDto {
}
exports.UserPerformanceDto = UserPerformanceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID of the user', format: 'uuid' }),
    __metadata("design:type", String)
], UserPerformanceDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Username of the user' }),
    __metadata("design:type", String)
], UserPerformanceDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Email of the user' }),
    __metadata("design:type", String)
], UserPerformanceDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Grade level of the user' }),
    __metadata("design:type", Number)
], UserPerformanceDto.prototype, "gradeLevel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Calculated overall score/proficiency of the user' }),
    __metadata("design:type", Number)
], UserPerformanceDto.prototype, "overallScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total number of assessments taken by the user' }),
    __metadata("design:type", Number)
], UserPerformanceDto.prototype, "assessmentCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [SkillPerformanceDto], description: 'Performance breakdown per skill' }),
    __metadata("design:type", Array)
], UserPerformanceDto.prototype, "skillPerformance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [AssessmentSummaryDto], description: 'Summary of recent assessments taken' }),
    __metadata("design:type", Array)
], UserPerformanceDto.prototype, "recentAssessments", void 0);
//# sourceMappingURL=user-performance.dto.js.map