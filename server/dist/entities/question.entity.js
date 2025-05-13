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
exports.Question = exports.QuestionStatus = exports.QuestionType = void 0;
const typeorm_1 = require("typeorm");
const graphql_1 = require("@nestjs/graphql");
const graphql_type_json_1 = require("graphql-type-json");
const skill_entity_1 = require("./skill.entity");
const assessment_response_entity_1 = require("./assessment_response.entity");
const class_transformer_1 = require("class-transformer");
var QuestionType;
(function (QuestionType) {
    QuestionType["MCQ"] = "MCQ";
    QuestionType["TRUE_FALSE"] = "TrueFalse";
    QuestionType["SHORT_ANSWER"] = "ShortAnswer";
    QuestionType["LONG_ANSWER"] = "LongAnswer";
    QuestionType["MATCH_THE_FOLLOWING"] = "MatchTheFollowing";
    QuestionType["FILL_IN_THE_BLANK"] = "FillInTheBlank";
    QuestionType["MULTIPLE_SELECT"] = "MultipleSelect";
    QuestionType["NUMERICAL"] = "Numerical";
    QuestionType["GRAPHICAL"] = "Graphical";
    QuestionType["PROBLEM_SOLVING"] = "ProblemSolving";
    QuestionType["ESSAY"] = "Essay";
})(QuestionType || (exports.QuestionType = QuestionType = {}));
var QuestionStatus;
(function (QuestionStatus) {
    QuestionStatus["DRAFT"] = "draft";
    QuestionStatus["ACTIVE"] = "active";
    QuestionStatus["RETIRED"] = "retired";
})(QuestionStatus || (exports.QuestionStatus = QuestionStatus = {}));
(0, graphql_1.registerEnumType)(QuestionType, {
    name: 'QuestionType',
});
(0, graphql_1.registerEnumType)(QuestionStatus, {
    name: 'QuestionStatus',
});
let Question = class Question {
};
exports.Question = Question;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Question.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ name: 'question_text', type: 'text', nullable: false }),
    __metadata("design:type", String)
], Question.prototype, "questionText", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)(() => QuestionType),
    (0, typeorm_1.Column)({
        name: 'question_type',
        type: 'enum',
        enum: QuestionType,
        nullable: false,
    }),
    __metadata("design:type", String)
], Question.prototype, "questionType", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)(() => graphql_type_json_1.GraphQLJSONObject, { nullable: true }),
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Question.prototype, "options", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ name: 'correct_answer', type: 'varchar', length: 255, nullable: false }),
    __metadata("design:type", String)
], Question.prototype, "correctAnswer", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)(() => graphql_1.Int, { nullable: true }),
    (0, typeorm_1.Column)({ name: 'difficulty_level', type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], Question.prototype, "difficultyLevel", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)(() => graphql_1.Int),
    (0, typeorm_1.Column)({ name: 'grade_level', type: 'integer', nullable: false }),
    __metadata("design:type", Number)
], Question.prototype, "gradeLevel", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)(() => QuestionStatus),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: QuestionStatus,
        default: QuestionStatus.DRAFT,
        nullable: false,
    }),
    __metadata("design:type", String)
], Question.prototype, "status", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ name: 'image_url', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Question.prototype, "imageUrl", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)(),
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Question.prototype, "createdAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, graphql_1.Field)(),
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Question.prototype, "updatedAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => skill_entity_1.Skill),
    (0, graphql_1.Field)(() => skill_entity_1.Skill),
    (0, typeorm_1.ManyToOne)(() => skill_entity_1.Skill, (skill) => skill.questions, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'primary_skill_id' }),
    __metadata("design:type", skill_entity_1.Skill)
], Question.prototype, "primarySkill", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(type => assessment_response_entity_1.AssessmentResponse, (response) => response.question),
    __metadata("design:type", Array)
], Question.prototype, "responses", void 0);
exports.Question = Question = __decorate([
    (0, graphql_1.ObjectType)(),
    (0, typeorm_1.Entity)({ name: 'questions' })
], Question);
//# sourceMappingURL=question.entity.js.map