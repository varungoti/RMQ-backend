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
var AiMetricsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiMetricsService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../redis.service");
let AiMetricsService = AiMetricsService_1 = class AiMetricsService {
    constructor(redisService) {
        this.redisService = redisService;
        this.logger = new common_1.Logger(AiMetricsService_1.name);
        this.METRICS_KEY = 'ai:metrics';
        this.MAX_RECENT_ERRORS = 100;
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errorsByType: {},
            recentErrors: [],
        };
        this.loadMetrics();
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
        };
        await this.saveMetrics();
    }
};
exports.AiMetricsService = AiMetricsService;
exports.AiMetricsService = AiMetricsService = AiMetricsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], AiMetricsService);
//# sourceMappingURL=ai-metrics.service.js.map