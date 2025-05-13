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
exports.AssessmentResponse = void 0;
const typeorm_1 = require("typeorm");
const graphql_1 = require("@nestjs/graphql");
const class_transformer_1 = require("class-transformer");
const assessment_session_entity_1 = require("./assessment_session.entity");
const question_entity_1 = require("./question.entity");
let AssessmentResponse = class AssessmentResponse {
};
exports.AssessmentResponse = AssessmentResponse;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AssessmentResponse.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ name: 'user_response', type: 'text', nullable: false }),
    __metadata("design:type", String)
], AssessmentResponse.prototype, "userResponse", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)(() => Boolean),
    (0, typeorm_1.Column)({ name: 'is_correct', type: 'boolean', nullable: false }),
    __metadata("design:type", Boolean)
], AssessmentResponse.prototype, "isCorrect", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)(),
    (0, typeorm_1.CreateDateColumn)({ name: 'answered_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], AssessmentResponse.prototype, "answeredAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)(() => graphql_1.Int, { nullable: true }),
    (0, typeorm_1.Column)({ name: 'response_time_ms', type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], AssessmentResponse.prototype, "responseTimeMs", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)(() => assessment_session_entity_1.AssessmentSession),
    (0, class_transformer_1.Type)(() => assessment_session_entity_1.AssessmentSession),
    (0, typeorm_1.ManyToOne)(() => assessment_session_entity_1.AssessmentSession, (session) => session.responses, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'assessment_session_id' }),
    __metadata("design:type", assessment_session_entity_1.AssessmentSession)
], AssessmentResponse.prototype, "assessmentSession", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)(() => question_entity_1.Question),
    (0, class_transformer_1.Type)(() => question_entity_1.Question),
    (0, typeorm_1.ManyToOne)(() => question_entity_1.Question, { nullable: false, eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'question_id' }),
    __metadata("design:type", question_entity_1.Question)
], AssessmentResponse.prototype, "question", void 0);
exports.AssessmentResponse = AssessmentResponse = __decorate([
    (0, graphql_1.ObjectType)(),
    (0, typeorm_1.Entity)({ name: 'assessment_responses' })
], AssessmentResponse);
//# sourceMappingURL=assessment_response.entity.js.map