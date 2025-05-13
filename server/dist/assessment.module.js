"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const assessment_service_1 = require("./assessment.service");
const assessment_controller_1 = require("./assessment.controller");
const assessment_session_entity_1 = require("./entities/assessment_session.entity");
const assessment_response_entity_1 = require("./entities/assessment_response.entity");
const assessment_skill_score_entity_1 = require("./entities/assessment_skill_score.entity");
const question_entity_1 = require("./entities/question.entity");
const user_entity_1 = require("./entities/user.entity");
const skill_entity_1 = require("./entities/skill.entity");
const default_answer_checker_1 = require("./assessment/checkers/default-answer.checker");
const mcq_answer_checker_1 = require("./assessment/checkers/mcq-answer.checker");
const true_false_answer_checker_1 = require("./assessment/checkers/true-false-answer.checker");
const numerical_answer_checker_1 = require("./assessment/checkers/numerical-answer.checker");
const answer_checker_factory_1 = require("./assessment/factories/answer-checker.factory");
let AssessmentModule = class AssessmentModule {
};
exports.AssessmentModule = AssessmentModule;
exports.AssessmentModule = AssessmentModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                assessment_session_entity_1.AssessmentSession,
                assessment_response_entity_1.AssessmentResponse,
                assessment_skill_score_entity_1.AssessmentSkillScore,
                question_entity_1.Question,
                user_entity_1.User,
                skill_entity_1.Skill,
            ]),
        ],
        controllers: [assessment_controller_1.AssessmentController],
        providers: [
            assessment_service_1.AssessmentService,
            default_answer_checker_1.DefaultAnswerChecker,
            mcq_answer_checker_1.McqAnswerChecker,
            true_false_answer_checker_1.TrueFalseAnswerChecker,
            numerical_answer_checker_1.NumericalAnswerChecker,
            answer_checker_factory_1.AnswerCheckerFactory,
        ],
        exports: [assessment_service_1.AssessmentService]
    })
], AssessmentModule);
//# sourceMappingURL=assessment.module.js.map