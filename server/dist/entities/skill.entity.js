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
exports.Skill = exports.SkillStatus = void 0;
const typeorm_1 = require("typeorm");
const graphql_1 = require("@nestjs/graphql");
const question_entity_1 = require("./question.entity");
const assessment_skill_score_entity_1 = require("./assessment_skill_score.entity");
var SkillStatus;
(function (SkillStatus) {
    SkillStatus["ACTIVE"] = "active";
    SkillStatus["INACTIVE"] = "inactive";
})(SkillStatus || (exports.SkillStatus = SkillStatus = {}));
(0, graphql_1.registerEnumType)(SkillStatus, {
    name: 'SkillStatus',
    description: 'The status of a skill (active or inactive)',
});
let Skill = class Skill {
};
exports.Skill = Skill;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Skill.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: false }),
    __metadata("design:type", String)
], Skill.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: false }),
    __metadata("design:type", String)
], Skill.prototype, "subject", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Skill.prototype, "category", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], Skill.prototype, "description", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    (0, typeorm_1.Column)({ name: 'grade_level', type: 'integer', nullable: false }),
    __metadata("design:type", Number)
], Skill.prototype, "gradeLevel", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Skill.prototype, "createdAt", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Skill.prototype, "updatedAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => SkillStatus),
    (0, typeorm_1.Column)({ name: 'status', type: 'enum', enum: SkillStatus, default: SkillStatus.ACTIVE, nullable: false }),
    __metadata("design:type", String)
], Skill.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ name: 'image_url', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Skill.prototype, "imageUrl", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    (0, typeorm_1.Column)({ name: 'is_primary', type: 'boolean', default: false, nullable: false }),
    __metadata("design:type", Boolean)
], Skill.prototype, "isPrimary", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean),
    (0, typeorm_1.Column)({ name: 'is_secondary', type: 'boolean', default: false, nullable: false }),
    __metadata("design:type", Boolean)
], Skill.prototype, "isSecondary", void 0);
__decorate([
    (0, graphql_1.Field)(() => [question_entity_1.Question], { nullable: 'itemsAndList' }),
    (0, typeorm_1.OneToMany)(type => question_entity_1.Question, (question) => question.primarySkill),
    __metadata("design:type", Array)
], Skill.prototype, "questions", void 0);
__decorate([
    (0, graphql_1.Field)(() => [assessment_skill_score_entity_1.AssessmentSkillScore], { nullable: 'itemsAndList' }),
    (0, typeorm_1.OneToMany)(type => assessment_skill_score_entity_1.AssessmentSkillScore, (skillScore) => skillScore.skill),
    __metadata("design:type", Array)
], Skill.prototype, "skillScores", void 0);
__decorate([
    (0, graphql_1.Field)(() => [Skill], { nullable: 'itemsAndList' }),
    (0, typeorm_1.ManyToMany)(() => Skill, (skill) => skill.primarySkills),
    (0, typeorm_1.JoinTable)({
        name: 'skill_relationships',
        joinColumn: { name: 'primary_skill_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'secondary_skill_id', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], Skill.prototype, "secondarySkills", void 0);
__decorate([
    (0, graphql_1.Field)(() => [Skill], { nullable: 'itemsAndList' }),
    (0, typeorm_1.ManyToMany)(() => Skill, (skill) => skill.secondarySkills),
    (0, typeorm_1.JoinTable)({
        name: 'skill_relationships',
        joinColumn: { name: 'secondary_skill_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'primary_skill_id', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], Skill.prototype, "primarySkills", void 0);
exports.Skill = Skill = __decorate([
    (0, graphql_1.ObjectType)(),
    (0, typeorm_1.Entity)({ name: 'skills' })
], Skill);
//# sourceMappingURL=skill.entity.js.map