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
exports.AssessmentSession = exports.AssessmentStatus = void 0;
const typeorm_1 = require("typeorm");
const graphql_1 = require("@nestjs/graphql");
const user_entity_1 = require("./user.entity");
const assessment_response_entity_1 = require("./assessment_response.entity");
const skill_entity_1 = require("./skill.entity");
const class_transformer_1 = require("class-transformer");
var AssessmentStatus;
(function (AssessmentStatus) {
    AssessmentStatus["IN_PROGRESS"] = "in_progress";
    AssessmentStatus["COMPLETED"] = "completed";
    AssessmentStatus["CANCELLED"] = "cancelled";
})(AssessmentStatus || (exports.AssessmentStatus = AssessmentStatus = {}));
(0, graphql_1.registerEnumType)(AssessmentStatus, {
    name: 'AssessmentStatus',
});
let AssessmentSession = class AssessmentSession {
};
exports.AssessmentSession = AssessmentSession;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AssessmentSession.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)(() => AssessmentStatus),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AssessmentStatus,
        default: AssessmentStatus.IN_PROGRESS,
        nullable: false,
    }),
    __metadata("design:type", String)
], AssessmentSession.prototype, "status", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)(),
    (0, typeorm_1.CreateDateColumn)({ name: 'started_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], AssessmentSession.prototype, "startedAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ name: 'completed_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], AssessmentSession.prototype, "completedAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)(() => graphql_1.Float, { nullable: true }),
    (0, typeorm_1.Column)({ name: 'overall_score', type: 'numeric', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], AssessmentSession.prototype, "overallScore", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)(() => graphql_1.Int, { nullable: true }),
    (0, typeorm_1.Column)({ name: 'overall_level', type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], AssessmentSession.prototype, "overallLevel", void 0);
__decorate([
    (0, graphql_1.Field)(() => [String]),
    (0, typeorm_1.Column)({ name: 'question_ids', type: 'text', array: true }),
    __metadata("design:type", Array)
], AssessmentSession.prototype, "questionIds", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)(() => user_entity_1.User),
    (0, class_transformer_1.Type)(() => user_entity_1.User),
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.assessmentSessions, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], AssessmentSession.prototype, "user", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)(() => skill_entity_1.Skill),
    (0, class_transformer_1.Type)(() => skill_entity_1.Skill),
    (0, typeorm_1.ManyToOne)(() => skill_entity_1.Skill, { nullable: false, eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'skill_id' }),
    __metadata("design:type", skill_entity_1.Skill)
], AssessmentSession.prototype, "skill", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)(() => [assessment_response_entity_1.AssessmentResponse], { nullable: 'itemsAndList' }),
    (0, class_transformer_1.Type)(() => assessment_response_entity_1.AssessmentResponse),
    (0, typeorm_1.OneToMany)(() => assessment_response_entity_1.AssessmentResponse, (response) => response.assessmentSession),
    __metadata("design:type", Array)
], AssessmentSession.prototype, "responses", void 0);
exports.AssessmentSession = AssessmentSession = __decorate([
    (0, graphql_1.ObjectType)(),
    (0, typeorm_1.Entity)({ name: 'assessment_sessions' })
], AssessmentSession);
//# sourceMappingURL=assessment_session.entity.js.map