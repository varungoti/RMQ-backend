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
exports.RecommendationFeedbackResponseDto = exports.CreateRecommendationFeedbackDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const recommendation_feedback_entity_1 = require("../entities/recommendation_feedback.entity");
class CreateRecommendationFeedbackDto {
    constructor() {
        this.source = recommendation_feedback_entity_1.FeedbackSource.USER;
    }
}
exports.CreateRecommendationFeedbackDto = CreateRecommendationFeedbackDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: recommendation_feedback_entity_1.FeedbackType,
        description: 'Type of feedback provided',
    }),
    (0, class_validator_1.IsEnum)(recommendation_feedback_entity_1.FeedbackType),
    __metadata("design:type", String)
], CreateRecommendationFeedbackDto.prototype, "feedbackType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: recommendation_feedback_entity_1.FeedbackSource,
        description: 'Source of the feedback',
        default: recommendation_feedback_entity_1.FeedbackSource.USER,
    }),
    (0, class_validator_1.IsEnum)(recommendation_feedback_entity_1.FeedbackSource),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateRecommendationFeedbackDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Additional comments about the feedback',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateRecommendationFeedbackDto.prototype, "comment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Impact score of the feedback (0-100)',
        minimum: 0,
        maximum: 100,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateRecommendationFeedbackDto.prototype, "impactScore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Additional metadata about the feedback',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateRecommendationFeedbackDto.prototype, "metadata", void 0);
class RecommendationFeedbackResponseDto {
}
exports.RecommendationFeedbackResponseDto = RecommendationFeedbackResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unique identifier for the feedback',
    }),
    __metadata("design:type", String)
], RecommendationFeedbackResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID of the user who provided the feedback',
    }),
    __metadata("design:type", String)
], RecommendationFeedbackResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID of the recommendation this feedback is for',
    }),
    __metadata("design:type", String)
], RecommendationFeedbackResponseDto.prototype, "recommendationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: recommendation_feedback_entity_1.FeedbackType,
        description: 'Type of feedback provided',
    }),
    __metadata("design:type", String)
], RecommendationFeedbackResponseDto.prototype, "feedbackType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: recommendation_feedback_entity_1.FeedbackSource,
        description: 'Source of the feedback',
    }),
    __metadata("design:type", String)
], RecommendationFeedbackResponseDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Additional comments about the feedback',
    }),
    __metadata("design:type", String)
], RecommendationFeedbackResponseDto.prototype, "comment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Impact score of the feedback (0-100)',
    }),
    __metadata("design:type", Number)
], RecommendationFeedbackResponseDto.prototype, "impactScore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Additional metadata about the feedback',
    }),
    __metadata("design:type", Object)
], RecommendationFeedbackResponseDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'When the feedback was created',
    }),
    __metadata("design:type", Date)
], RecommendationFeedbackResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'When the feedback was last updated',
    }),
    __metadata("design:type", Object)
], RecommendationFeedbackResponseDto.prototype, "", void 0);
//# sourceMappingURL=recommendation-feedback.dto.js.map