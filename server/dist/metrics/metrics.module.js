"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const ai_metrics_service_1 = require("./ai-metrics.service");
const redis_module_1 = require("../redis.module");
const recommendation_feedback_entity_1 = require("../entities/recommendation_feedback.entity");
const skill_entity_1 = require("../entities/skill.entity");
const feedback_validation_service_1 = require("../services/feedback-validation.service");
const feedback_analysis_service_1 = require("../services/feedback-analysis.service");
let MetricsModule = class MetricsModule {
};
exports.MetricsModule = MetricsModule;
exports.MetricsModule = MetricsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([recommendation_feedback_entity_1.RecommendationFeedback, skill_entity_1.Skill]),
            redis_module_1.RedisModule,
        ],
        providers: [
            ai_metrics_service_1.AiMetricsService,
            feedback_validation_service_1.FeedbackValidationService,
            feedback_analysis_service_1.FeedbackAnalysisService,
        ],
        exports: [
            ai_metrics_service_1.AiMetricsService,
            feedback_validation_service_1.FeedbackValidationService,
            feedback_analysis_service_1.FeedbackAnalysisService,
        ],
    })
], MetricsModule);
//# sourceMappingURL=metrics.module.js.map