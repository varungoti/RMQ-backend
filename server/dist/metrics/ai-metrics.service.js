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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AiMetricsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiMetricsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const redis_service_1 = require("../redis.service");
const recommendation_feedback_entity_1 = require("../entities/recommendation_feedback.entity");
let AiMetricsService = AiMetricsService_1 = class AiMetricsService {
    constructor(redisService, feedbackRepository) {
        this.redisService = redisService;
        this.feedbackRepository = feedbackRepository;
        this.logger = new common_1.Logger(AiMetricsService_1.name);
        this.METRICS_KEY = 'ai:metrics';
        this.MAX_RECENT_ERRORS = 100;
        this.MAX_COMMON_ISSUES = 10;
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errorsByType: {},
            recentErrors: [],
            feedback: {
                totalFeedback: 0,
                feedbackByType: {},
                resourceTypeEffectiveness: {},
                averageImpactScore: 0,
                commonIssues: [],
            },
        };
        this.loadMetrics();
        this.startPeriodicFeedbackAnalysis();
    }
    async loadMetrics() {
        if (!this.redisService.isEnabled()) {
            return;
        }
        try {
            const storedMetrics = await this.redisService.get(this.METRICS_KEY);
            if (storedMetrics) {
                this.metrics = JSON.parse(storedMetrics);
            }
            await this.updateFeedbackMetrics();
        }
        catch (error) {
            this.logger.error(`Failed to load metrics from Redis: ${error.message}`);
        }
    }
    async saveMetrics() {
        if (!this.redisService.isEnabled()) {
            return;
        }
        try {
            await this.redisService.set(this.METRICS_KEY, JSON.stringify(this.metrics));
        }
        catch (error) {
            this.logger.error(`Failed to save metrics to Redis: ${error.message}`);
        }
    }
    startPeriodicFeedbackAnalysis() {
        setInterval(async () => {
            await this.updateFeedbackMetrics();
        }, 60 * 60 * 1000);
    }
    async updateFeedbackMetrics() {
        try {
            const feedback = await this.feedbackRepository.find({
                order: { createdAt: 'DESC' },
            });
            const metrics = this.metrics.feedback;
            metrics.totalFeedback = feedback.length;
            metrics.feedbackByType = {};
            metrics.resourceTypeEffectiveness = {};
            metrics.commonIssues = [];
            let totalImpactScore = 0;
            let impactScoreCount = 0;
            const issues = new Map();
            feedback.forEach(item => {
                metrics.feedbackByType[item.feedbackType] = (metrics.feedbackByType[item.feedbackType] || 0) + 1;
                const resourceType = item.metadata?.resourceType;
                if (resourceType) {
                    if (!metrics.resourceTypeEffectiveness[resourceType]) {
                        metrics.resourceTypeEffectiveness[resourceType] = {
                            total: 0,
                            helpful: 0,
                            notHelpful: 0,
                            effectiveness: 0,
                        };
                    }
                    const stats = metrics.resourceTypeEffectiveness[resourceType];
                    stats.total++;
                    if (item.feedbackType === recommendation_feedback_entity_1.FeedbackType.HELPFUL) {
                        stats.helpful++;
                    }
                    else if (item.feedbackType === recommendation_feedback_entity_1.FeedbackType.NOT_HELPFUL) {
                        stats.notHelpful++;
                    }
                    stats.effectiveness = stats.total > 0 ? (stats.helpful / stats.total) * 100 : 0;
                }
                if (item.impactScore !== null && item.impactScore !== undefined) {
                    totalImpactScore += item.impactScore;
                    impactScoreCount++;
                }
                if (item.comment) {
                    issues.set(item.comment, (issues.get(item.comment) || 0) + 1);
                }
            });
            metrics.averageImpactScore = impactScoreCount > 0 ? totalImpactScore / impactScoreCount : 0;
            metrics.commonIssues = Array.from(issues.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, this.MAX_COMMON_ISSUES)
                .map(([issue, count]) => ({ issue, count }));
            await this.saveMetrics();
        }
        catch (error) {
            this.logger.error(`Failed to update feedback metrics: ${error.message}`);
        }
    }
    async recordRequest(success, responseTime, fromCache, error) {
        this.metrics.totalRequests++;
        if (success) {
            this.metrics.successfulRequests++;
        }
        else {
            this.metrics.failedRequests++;
            if (error) {
                this.metrics.errorsByType[error.code] = (this.metrics.errorsByType[error.code] || 0) + 1;
                this.metrics.recentErrors.unshift({
                    ...error,
                    timestamp: new Date(),
                });
                if (this.metrics.recentErrors.length > this.MAX_RECENT_ERRORS) {
                    this.metrics.recentErrors.pop();
                }
            }
        }
        if (fromCache) {
            this.metrics.cacheHits++;
        }
        else {
            this.metrics.cacheMisses++;
        }
        const totalResponses = this.metrics.successfulRequests + this.metrics.failedRequests;
        this.metrics.averageResponseTime =
            (this.metrics.averageResponseTime * (totalResponses - 1) + responseTime) / totalResponses;
        await this.saveMetrics();
    }
    async getMetrics() {
        await this.updateFeedbackMetrics();
        return {
            ...this.metrics,
            successRate: this.metrics.totalRequests > 0
                ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100
                : 0,
            cacheHitRate: (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
                ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100
                : 0,
        };
    }
    async resetMetrics() {
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errorsByType: {},
            recentErrors: [],
            feedback: {
                totalFeedback: 0,
                feedbackByType: {},
                resourceTypeEffectiveness: {},
                averageImpactScore: 0,
                commonIssues: [],
            },
        };
        await this.saveMetrics();
    }
};
exports.AiMetricsService = AiMetricsService;
exports.AiMetricsService = AiMetricsService = AiMetricsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(recommendation_feedback_entity_1.RecommendationFeedback)),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        typeorm_2.Repository])
], AiMetricsService);
//# sourceMappingURL=ai-metrics.service.js.map