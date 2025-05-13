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
exports.RecommendationHistory = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const skill_entity_1 = require("./skill.entity");
const recommendation_resource_entity_1 = require("./recommendation_resource.entity");
const recommendation_dto_1 = require("../dto/recommendation.dto");
let RecommendationHistory = class RecommendationHistory {
};
exports.RecommendationHistory = RecommendationHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RecommendationHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], RecommendationHistory.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => skill_entity_1.Skill, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'skill_id' }),
    __metadata("design:type", skill_entity_1.Skill)
], RecommendationHistory.prototype, "skill", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => recommendation_resource_entity_1.RecommendationResource, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'resource_id' }),
    __metadata("design:type", recommendation_resource_entity_1.RecommendationResource)
], RecommendationHistory.prototype, "resource", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: recommendation_dto_1.RecommendationPriority,
        default: recommendation_dto_1.RecommendationPriority.MEDIUM,
    }),
    __metadata("design:type", String)
], RecommendationHistory.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2 }),
    __metadata("design:type", Number)
], RecommendationHistory.prototype, "userScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2 }),
    __metadata("design:type", Number)
], RecommendationHistory.prototype, "targetScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], RecommendationHistory.prototype, "explanation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], RecommendationHistory.prototype, "isCompleted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], RecommendationHistory.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], RecommendationHistory.prototype, "wasHelpful", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], RecommendationHistory.prototype, "isAiGenerated", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RecommendationHistory.prototype, "createdAt", void 0);
exports.RecommendationHistory = RecommendationHistory = __decorate([
    (0, typeorm_1.Entity)()
], RecommendationHistory);
//# sourceMappingURL=recommendation_history.entity.js.map