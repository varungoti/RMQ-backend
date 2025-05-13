"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const recommendations_controller_1 = require("./recommendations.controller");
const recommendations_service_1 = require("./recommendations.service");
const ai_recommendation_service_1 = require("./ai-recommendation.service");
const llm_factory_service_1 = require("./llm/llm-factory.service");
const redis_module_1 = require("./redis.module");
const metrics_module_1 = require("./metrics/metrics.module");
const recommendation_entity_1 = require("./entities/recommendation.entity");
const recommendation_history_entity_1 = require("./entities/recommendation_history.entity");
const recommendation_resource_entity_1 = require("./entities/recommendation_resource.entity");
const recommendation_feedback_entity_1 = require("./entities/recommendation_feedback.entity");
const user_entity_1 = require("./entities/user.entity");
const skill_entity_1 = require("./entities/skill.entity");
const assessment_session_entity_1 = require("./entities/assessment_session.entity");
const assessment_response_entity_1 = require("./entities/assessment_response.entity");
const assessment_skill_score_entity_1 = require("./entities/assessment_skill_score.entity");
let RecommendationsModule = class RecommendationsModule {
};
exports.RecommendationsModule = RecommendationsModule;
exports.RecommendationsModule = RecommendationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.User,
                skill_entity_1.Skill,
                assessment_session_entity_1.AssessmentSession,
                assessment_response_entity_1.AssessmentResponse,
                assessment_skill_score_entity_1.AssessmentSkillScore,
                recommendation_entity_1.Recommendation,
                recommendation_history_entity_1.RecommendationHistory,
                recommendation_resource_entity_1.RecommendationResource,
                recommendation_feedback_entity_1.RecommendationFeedback,
            ]),
            redis_module_1.RedisModule,
            metrics_module_1.MetricsModule,
        ],
        controllers: [recommendations_controller_1.RecommendationsController],
        providers: [
            recommendations_service_1.RecommendationsService,
            ai_recommendation_service_1.AiRecommendationService,
            llm_factory_service_1.LlmFactoryService,
        ],
        exports: [recommendations_service_1.RecommendationsService, ai_recommendation_service_1.AiRecommendationService],
    })
], RecommendationsModule);
//# sourceMappingURL=recommendations.module.js.map