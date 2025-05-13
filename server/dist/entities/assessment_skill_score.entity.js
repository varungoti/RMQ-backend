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
exports.AssessmentSkillScore = exports.NumericTransformer = void 0;
const typeorm_1 = require("typeorm");
const graphql_1 = require("@nestjs/graphql");
const user_entity_1 = require("./user.entity");
const skill_entity_1 = require("./skill.entity");
class NumericTransformer {
    to(data) {
        return data?.toString() ?? null;
    }
    from(data) {
        if (data === null || data === undefined)
            return null;
        const numberValue = parseFloat(data);
        return isNaN(numberValue) ? null : numberValue;
    }
}
exports.NumericTransformer = NumericTransformer;
let AssessmentSkillScore = class AssessmentSkillScore {
};
exports.AssessmentSkillScore = AssessmentSkillScore;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AssessmentSkillScore.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    (0, typeorm_1.Column)({
        name: 'score',
        type: 'numeric',
        precision: 5,
        scale: 2,
        default: 0,
        nullable: false,
        transformer: new NumericTransformer()
    }),
    __metadata("design:type", Number)
], AssessmentSkillScore.prototype, "score", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int, { nullable: true }),
    (0, typeorm_1.Column)({ name: 'level', type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], AssessmentSkillScore.prototype, "level", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    (0, typeorm_1.Column)({ name: 'questions_attempted', type: 'integer', default: 0, nullable: false }),
    __metadata("design:type", Number)
], AssessmentSkillScore.prototype, "questionsAttempted", void 0);
__decorate([
    (0, graphql_1.Field)(() => Date),
    (0, typeorm_1.UpdateDateColumn)({ name: 'last_assessed_at', type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], AssessmentSkillScore.prototype, "lastAssessedAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => user_entity_1.User),
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.skillScores, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], AssessmentSkillScore.prototype, "user", void 0);
__decorate([
    (0, graphql_1.Field)(() => skill_entity_1.Skill),
    (0, typeorm_1.ManyToOne)(() => skill_entity_1.Skill, { nullable: false, eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'skill_id' }),
    __metadata("design:type", skill_entity_1.Skill)
], AssessmentSkillScore.prototype, "skill", void 0);
exports.AssessmentSkillScore = AssessmentSkillScore = __decorate([
    (0, graphql_1.ObjectType)(),
    (0, typeorm_1.Entity)({ name: 'assessment_skill_scores' }),
    (0, typeorm_1.Unique)(['user', 'skill'])
], AssessmentSkillScore);
//# sourceMappingURL=assessment_skill_score.entity.js.map