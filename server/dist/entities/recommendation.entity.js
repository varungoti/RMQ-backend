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
exports.Recommendation = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const skill_entity_1 = require("./skill.entity");
const recommendation_resource_entity_1 = require("./recommendation_resource.entity");
const recommendation_dto_1 = require("../dto/recommendation.dto");
const recommendation_feedback_entity_1 = require("./recommendation_feedback.entity");
let Recommendation = class Recommendation {
};
exports.Recommendation = Recommendation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Recommendation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    __metadata("design:type", user_entity_1.User)
], Recommendation.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Recommendation.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => skill_entity_1.Skill),
    __metadata("design:type", skill_entity_1.Skill)
], Recommendation.prototype, "skill", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Recommendation.prototype, "skillId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Recommendation.prototype, "skillName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: recommendation_dto_1.RecommendationPriority,
        default: recommendation_dto_1.RecommendationPriority.MEDIUM,
    }),
    __metadata("design:type", String)
], Recommendation.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)('float'),
    __metadata("design:type", Number)
], Recommendation.prototype, "score", void 0);
__decorate([
    (0, typeorm_1.Column)('float'),
    __metadata("design:type", Number)
], Recommendation.prototype, "targetScore", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], Recommendation.prototype, "explanation", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Recommendation.prototype, "aiGenerated", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => recommendation_resource_entity_1.RecommendationResource),
    (0, typeorm_1.JoinTable)(),
    __metadata("design:type", Array)
], Recommendation.prototype, "resources", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => recommendation_feedback_entity_1.RecommendationFeedback, feedback => feedback.recommendation),
    __metadata("design:type", Array)
], Recommendation.prototype, "feedback", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Recommendation.prototype, "completed", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Recommendation.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Boolean)
], Recommendation.prototype, "wasHelpful", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Recommendation.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Recommendation.prototype, "updatedAt", void 0);
exports.Recommendation = Recommendation = __decorate([
    (0, typeorm_1.Entity)()
], Recommendation);
//# sourceMappingURL=recommendation.entity.js.map