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
exports.RecommendationFeedback = exports.FeedbackSource = exports.FeedbackType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const recommendation_entity_1 = require("./recommendation.entity");
var FeedbackType;
(function (FeedbackType) {
    FeedbackType["HELPFUL"] = "helpful";
    FeedbackType["NOT_HELPFUL"] = "not_helpful";
    FeedbackType["PARTIALLY_HELPFUL"] = "partially_helpful";
    FeedbackType["IRRELEVANT"] = "irrelevant";
    FeedbackType["TOO_DIFFICULT"] = "too_difficult";
    FeedbackType["TOO_EASY"] = "too_easy";
})(FeedbackType || (exports.FeedbackType = FeedbackType = {}));
var FeedbackSource;
(function (FeedbackSource) {
    FeedbackSource["USER"] = "user";
    FeedbackSource["ASSESSMENT"] = "assessment";
    FeedbackSource["AI"] = "ai";
    FeedbackSource["SYSTEM"] = "system";
})(FeedbackSource || (exports.FeedbackSource = FeedbackSource = {}));
let RecommendationFeedback = class RecommendationFeedback {
};
exports.RecommendationFeedback = RecommendationFeedback;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RecommendationFeedback.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    __metadata("design:type", user_entity_1.User)
], RecommendationFeedback.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RecommendationFeedback.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => recommendation_entity_1.Recommendation),
    __metadata("design:type", recommendation_entity_1.Recommendation)
], RecommendationFeedback.prototype, "recommendation", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RecommendationFeedback.prototype, "recommendationId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: FeedbackType,
    }),
    __metadata("design:type", String)
], RecommendationFeedback.prototype, "feedbackType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: FeedbackSource,
        default: FeedbackSource.USER,
    }),
    __metadata("design:type", String)
], RecommendationFeedback.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], RecommendationFeedback.prototype, "comment", void 0);
__decorate([
    (0, typeorm_1.Column)('float', { nullable: true }),
    __metadata("design:type", Number)
], RecommendationFeedback.prototype, "impactScore", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", Object)
], RecommendationFeedback.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RecommendationFeedback.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], RecommendationFeedback.prototype, "updatedAt", void 0);
exports.RecommendationFeedback = RecommendationFeedback = __decorate([
    (0, typeorm_1.Entity)()
], RecommendationFeedback);
//# sourceMappingURL=recommendation_feedback.entity.js.map