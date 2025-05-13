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
exports.RecommendationResource = void 0;
const typeorm_1 = require("typeorm");
const skill_entity_1 = require("./skill.entity");
const recommendation_dto_1 = require("../dto/recommendation.dto");
let RecommendationResource = class RecommendationResource {
};
exports.RecommendationResource = RecommendationResource;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RecommendationResource.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], RecommendationResource.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], RecommendationResource.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 2048 }),
    __metadata("design:type", String)
], RecommendationResource.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: recommendation_dto_1.RecommendationType,
        default: recommendation_dto_1.RecommendationType.PRACTICE,
    }),
    __metadata("design:type", String)
], RecommendationResource.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 15 }),
    __metadata("design:type", Number)
], RecommendationResource.prototype, "estimatedTimeMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], RecommendationResource.prototype, "gradeLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], RecommendationResource.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => skill_entity_1.Skill),
    (0, typeorm_1.JoinTable)({
        name: 'recommendation_resource_skills',
        joinColumn: { name: 'resource_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'skill_id', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], RecommendationResource.prototype, "relatedSkills", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], RecommendationResource.prototype, "isAiGenerated", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RecommendationResource.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], RecommendationResource.prototype, "updatedAt", void 0);
exports.RecommendationResource = RecommendationResource = __decorate([
    (0, typeorm_1.Entity)()
], RecommendationResource);
//# sourceMappingURL=recommendation_resource.entity.js.map