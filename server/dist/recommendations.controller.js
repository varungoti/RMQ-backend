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
var RecommendationsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("./auth/jwt-auth.guard");
const roles_guard_1 = require("./guards/roles.guard");
const roles_decorator_1 = require("./decorators/roles.decorator");
const user_entity_1 = require("./entities/user.entity");
const recommendations_service_1 = require("./recommendations.service");
const recommendation_dto_1 = require("./dto/recommendation.dto");
const recommendation_feedback_dto_1 = require("./dto/recommendation-feedback.dto");
const llm_factory_service_1 = require("./llm/llm-factory.service");
const llm_provider_dto_1 = require("./dto/llm-provider.dto");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const ai_recommendation_service_1 = require("./ai-recommendation.service");
const ai_metrics_service_1 = require("./metrics/ai-metrics.service");
class SimpleSuccessResponseDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], SimpleSuccessResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], SimpleSuccessResponseDto.prototype, "message", void 0);
class LlmInfoProviderDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ enum: llm_provider_dto_1.LlmProviderType, description: 'LLM Provider Type' }),
    __metadata("design:type", String)
], LlmInfoProviderDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the provider is currently enabled' }),
    __metadata("design:type", Boolean)
], LlmInfoProviderDto.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Model used by this provider', example: 'gpt-3.5-turbo' }),
    __metadata("design:type", String)
], LlmInfoProviderDto.prototype, "model", void 0);
class LlmInfoResponseDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ enum: llm_provider_dto_1.LlmProviderType, description: 'The currently selected default LLM provider' }),
    __metadata("design:type", String)
], LlmInfoResponseDto.prototype, "defaultProvider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [LlmInfoProviderDto], description: 'List of all available providers and their status' }),
    __metadata("design:type", Array)
], LlmInfoResponseDto.prototype, "availableProviders", void 0);
class SelectLlmRequestDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ enum: llm_provider_dto_1.LlmProviderType, description: 'The LLM provider to select as default' }),
    (0, class_validator_1.IsEnum)(llm_provider_dto_1.LlmProviderType),
    __metadata("design:type", String)
], SelectLlmRequestDto.prototype, "provider", void 0);
class CacheStatsMetricsDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CacheStatsMetricsDto.prototype, "hits", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CacheStatsMetricsDto.prototype, "misses", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CacheStatsMetricsDto.prototype, "hitRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CacheStatsMetricsDto.prototype, "evictions", void 0);
class CacheStatsResponseDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], CacheStatsResponseDto.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CacheStatsResponseDto.prototype, "size", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CacheStatsResponseDto.prototype, "maxSize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CacheStatsResponseDto.prototype, "ttlSeconds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: CacheStatsMetricsDto }),
    __metadata("design:type", CacheStatsMetricsDto)
], CacheStatsResponseDto.prototype, "metrics", void 0);
class UpdateLlmConfigRequestDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ enum: llm_provider_dto_1.LlmProviderType, description: 'The provider to configure' }),
    (0, class_validator_1.IsEnum)(llm_provider_dto_1.LlmProviderType),
    __metadata("design:type", String)
], UpdateLlmConfigRequestDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'New model name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateLlmConfigRequestDto.prototype, "model", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'New temperature setting' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateLlmConfigRequestDto.prototype, "temperature", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'New API key (sensitive)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateLlmConfigRequestDto.prototype, "apiKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Enable/disable the provider' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateLlmConfigRequestDto.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'New endpoint URL (for self-hosted/custom providers)' }),
    (0, class_validator_1.IsUrl)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateLlmConfigRequestDto.prototype, "endpoint", void 0);
class UpdateConfigResponseCacheDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], UpdateConfigResponseCacheDto.prototype, "invalidated", void 0);
class UpdateConfigResponseDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], UpdateConfigResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UpdateConfigResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: UpdateConfigResponseCacheDto }),
    __metadata("design:type", UpdateConfigResponseCacheDto)
], UpdateConfigResponseDto.prototype, "cache", void 0);
class AiErrorMetricsDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total number of failed requests' }),
    __metadata("design:type", Number)
], AiErrorMetricsDto.prototype, "totalErrors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Count of errors by error type' }),
    __metadata("design:type", Object)
], AiErrorMetricsDto.prototype, "errorsByType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'List of recent errors with details', type: [Object] }),
    __metadata("design:type", Array)
], AiErrorMetricsDto.prototype, "recentErrors", void 0);
class AiMetricsResponseDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total number of AI recommendation requests' }),
    __metadata("design:type", Number)
], AiMetricsResponseDto.prototype, "totalRequests", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Percentage of successful AI recommendations' }),
    __metadata("design:type", Number)
], AiMetricsResponseDto.prototype, "successRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Percentage of cache hits' }),
    __metadata("design:type", Number)
], AiMetricsResponseDto.prototype, "cacheHitRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Average response time in milliseconds' }),
    __metadata("design:type", Number)
], AiMetricsResponseDto.prototype, "averageResponseTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Detailed error metrics', type: AiErrorMetricsDto }),
    __metadata("design:type", AiErrorMetricsDto)
], AiMetricsResponseDto.prototype, "errorMetrics", void 0);
class LlmValidationErrorDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Error code' }),
    __metadata("design:type", String)
], LlmValidationErrorDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Error message' }),
    __metadata("design:type", String)
], LlmValidationErrorDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Validation error details', type: [Object] }),
    __metadata("design:type", Array)
], LlmValidationErrorDto.prototype, "details", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Raw response that failed validation' }),
    __metadata("design:type", Object)
], LlmValidationErrorDto.prototype, "rawResponse", void 0);
class LlmParseErrorDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Error code' }),
    __metadata("design:type", String)
], LlmParseErrorDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Error message' }),
    __metadata("design:type", String)
], LlmParseErrorDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Response that failed parsing' }),
    __metadata("design:type", String)
], LlmParseErrorDto.prototype, "response", void 0);
class LlmMetricsResponseDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total number of LLM requests' }),
    __metadata("design:type", Number)
], LlmMetricsResponseDto.prototype, "totalAttempts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of valid responses' }),
    __metadata("design:type", Number)
], LlmMetricsResponseDto.prototype, "validResponses", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of invalid responses' }),
    __metadata("design:type", Number)
], LlmMetricsResponseDto.prototype, "invalidResponses", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Average attempts per request' }),
    __metadata("design:type", Number)
], LlmMetricsResponseDto.prototype, "averageAttempts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Recent validation errors', type: [LlmValidationErrorDto] }),
    __metadata("design:type", Array)
], LlmMetricsResponseDto.prototype, "validationErrors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Recent parse errors', type: [LlmParseErrorDto] }),
    __metadata("design:type", Array)
], LlmMetricsResponseDto.prototype, "parseErrors", void 0);
let RecommendationsController = RecommendationsController_1 = class RecommendationsController {
    constructor(recommendationsService, llmFactory, aiRecommendationService, aiMetrics) {
        this.recommendationsService = recommendationsService;
        this.llmFactory = llmFactory;
        this.aiRecommendationService = aiRecommendationService;
        this.aiMetrics = aiMetrics;
        this.logger = new common_1.Logger(RecommendationsController_1.name);
    }
    async getRecommendations(req, queryParams) {
        this.logger.log(`User ${req.user.userId} requesting recommendations with query: ${JSON.stringify(queryParams)}`);
        if (queryParams.userId && queryParams.userId !== req.user.userId) {
            if (req.user.role !== user_entity_1.UserRole.ADMIN && req.user.role !== user_entity_1.UserRole.TEACHER) {
                throw new common_1.ForbiddenException('Only administrators or teachers can access other users\' recommendations');
            }
        }
        const userId = queryParams.userId || req.user.userId;
        return this.recommendationsService.getRecommendations(userId, queryParams);
    }
    async markRecommendationCompleted(req, recommendationId, body) {
        this.logger.log(`User ${req.user.userId} marking recommendation ${recommendationId} as complete.`);
        try {
            await this.recommendationsService.markRecommendationCompleted(req.user.userId, recommendationId, body.wasHelpful);
            return { success: true, message: 'Recommendation marked as completed successfully.' };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw new common_1.NotFoundException(error.message);
            }
            else if (error instanceof common_1.ForbiddenException) {
                throw new common_1.ForbiddenException(error.message);
            }
            this.logger.error(`Failed to mark recommendation ${recommendationId} complete for user ${req.user.userId}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to mark recommendation as completed.');
        }
    }
    async getRecommendationHistory(req, limit, offset, skillId, completed) {
        this.logger.log(`User ${req.user.userId} requesting recommendation history with filters: limit=${limit}, offset=${offset}, skillId=${skillId}, completed=${completed}`);
        return this.recommendationsService.getUserRecommendationHistory(req.user.userId, limit, offset, skillId, completed);
    }
    async getRecommendationResources(skillId, type, gradeLevel) {
        this.logger.log(`Fetching recommendation resources (skillId: ${skillId}, type: ${type}, gradeLevel: ${gradeLevel})`);
        return this.recommendationsService.getRecommendationResources(type, gradeLevel);
    }
    async createRecommendationResource(req, createDto) {
        this.logger.log(`Admin ${req.user.userId} creating new recommendation resource: ${createDto.title}`);
        return this.recommendationsService.createRecommendationResource(createDto);
    }
    async getLlmInfo() {
        this.logger.log(`Fetching LLM info.`);
        const defaultProviderType = this.llmFactory.getDefaultProvider().getConfig().type;
        const availableProviders = [];
        const allProvidersMap = this.llmFactory.getAllProviders();
        allProvidersMap.forEach((providerService, providerType) => {
            availableProviders.push({
                type: providerType,
                enabled: providerService.isEnabled(),
                model: providerService.getConfig().model || 'N/A',
            });
        });
        return { defaultProvider: defaultProviderType, availableProviders };
    }
    async selectLlmProvider(req, body) {
        this.logger.log(`Admin ${req.user.userId} selecting LLM provider: ${body.provider}`);
        try {
            const success = this.llmFactory.setDefaultProvider(body.provider);
            if (success) {
                return { success: true, message: `Default LLM provider set to ${body.provider}` };
            }
            else {
                throw new common_1.BadRequestException(`Provider ${body.provider} not found or could not be set.`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to set LLM provider to ${body.provider}`, error.stack);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to update LLM provider.');
        }
    }
    async getLlmCacheStats() {
        this.logger.log(`Fetching LLM cache stats.`);
        const stats = await this.llmFactory.getCacheStats();
        return {
            enabled: stats.enabled,
            size: stats.size,
            maxSize: stats.maxSize,
            ttlSeconds: stats.ttlSeconds,
            metrics: {
                hits: stats.metrics.hits,
                misses: stats.metrics.misses,
                hitRate: stats.metrics.hitRate,
                evictions: stats.metrics.evictions,
            }
        };
    }
    async clearLlmCache() {
        this.logger.log(`Clearing LLM cache.`);
        this.llmFactory.clearCache();
        return { success: true, message: 'LLM cache cleared successfully.' };
    }
    async resetLlmCacheMetrics() {
        this.logger.log(`Resetting LLM cache metrics.`);
        this.llmFactory.resetCacheMetrics();
        return { success: true, message: 'LLM cache metrics reset successfully.' };
    }
    async updateLlmConfig(body) {
        this.logger.log(`Updating LLM config for provider: ${body.provider}`);
        try {
            const cacheInvalidated = this.llmFactory.updateProviderConfig(body.provider, {
                model: body.model,
                temperature: body.temperature,
                apiKey: body.apiKey,
                enabled: body.enabled,
                endpoint: body.endpoint,
            });
            return {
                success: true,
                message: `Configuration for ${body.provider} updated successfully.`,
                cache: { invalidated: cacheInvalidated }
            };
        }
        catch (error) {
            this.logger.error(`Failed to update LLM config for ${body.provider}`, error.stack);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to update LLM configuration.');
        }
    }
    async getAiSkillGapExplanation(req, skillId) {
        this.logger.log(`User ${req.user.userId} requesting AI explanation for skill gap: ${skillId}`);
        try {
            const explanationResult = await this.recommendationsService.getAiSkillGapExplanation(req.user.userId, skillId);
            if (!explanationResult) {
                this.logger.warn(`No explanation generated for user ${req.user.userId}, skill ${skillId}.`);
                return null;
            }
            const responseDto = new recommendation_dto_1.SkillGapExplanationResponseDto();
            responseDto.explanation = explanationResult;
            return responseDto;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw new common_1.NotFoundException(error.message);
            }
            this.logger.error(`Failed to get AI explanation for user ${req.user.userId}, skill ${skillId}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to generate AI explanation.');
        }
    }
    async getAiMetrics() {
        const metrics = await this.aiMetrics.getMetrics();
        return {
            totalRequests: metrics.totalRequests,
            successRate: metrics.successRate || 0,
            cacheHitRate: metrics.cacheHitRate || 0,
            averageResponseTime: metrics.averageResponseTime,
            errorMetrics: {
                totalErrors: metrics.failedRequests,
                errorsByType: metrics.errorsByType,
                recentErrors: metrics.recentErrors.map(error => ({
                    code: error.code,
                    message: error.message,
                    timestamp: error.timestamp,
                    userId: error.userId,
                    skillId: error.skillId,
                    attempt: error.attempt,
                    provider: error.provider,
                })),
            },
        };
    }
    async resetAiMetrics() {
        await this.aiMetrics.resetMetrics();
        return { success: true, message: 'AI metrics reset successfully' };
    }
    async getLlmMetrics() {
        return this.aiRecommendationService.getMetrics();
    }
    async resetLlmMetrics() {
        this.aiRecommendationService.resetMetrics();
        return { success: true, message: 'LLM metrics have been reset' };
    }
    async addRecommendationFeedback(req, recommendationId, feedbackDto) {
        this.logger.log(`User ${req.user.userId} adding feedback for recommendation ${recommendationId}`);
        const feedback = await this.recommendationsService.addRecommendationFeedback(req.user.userId, recommendationId, feedbackDto);
        return feedback;
    }
    async getRecommendationFeedback(req, recommendationId) {
        this.logger.log(`User ${req.user.userId} requesting feedback for recommendation ${recommendationId}`);
        return this.recommendationsService.getRecommendationFeedback(req.user.userId, recommendationId);
    }
    async getUserFeedbackStats(req) {
        this.logger.log(`User ${req.user.userId} requesting feedback statistics`);
        return this.recommendationsService.getUserFeedbackStats(req.user.userId);
    }
};
exports.RecommendationsController = RecommendationsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get personalized recommendations' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false, description: 'Target User ID (Admin/Teacher only)', type: String, format: 'uuid' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Max number of recommendations', type: Number, example: 5 }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, description: 'Filter by recommendation type', enum: recommendation_dto_1.RecommendationType }),
    (0, swagger_1.ApiQuery)({ name: 'skillId', required: false, description: 'Filter by specific skill ID', type: String, format: 'uuid' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns personalized recommendations', type: recommendation_dto_1.RecommendationSetDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Cannot access other user\'s recommendations' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, recommendation_dto_1.RecommendationQueryDto]),
    __metadata("design:returntype", Promise)
], RecommendationsController.prototype, "getRecommendations", null);
__decorate([
    (0, common_1.Post)('history/:recommendationId/complete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Mark a recommendation as completed' }),
    (0, swagger_1.ApiParam)({ name: 'recommendationId', description: 'Recommendation ID (UUID)', type: String }),
    (0, swagger_1.ApiBody)({ type: recommendation_dto_1.MarkCompletedRequestDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Recommendation marked as completed', type: SimpleSuccessResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Recommendation not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('recommendationId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, recommendation_dto_1.MarkCompletedRequestDto]),
    __metadata("design:returntype", Promise)
], RecommendationsController.prototype, "markRecommendationCompleted", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get recommendation history' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Limit number of results', type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false, description: 'Offset results', type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'skillId', required: false, description: 'Filter by skill ID', type: String, format: 'uuid' }),
    (0, swagger_1.ApiQuery)({ name: 'completed', required: false, description: 'Filter by completion status', type: Boolean }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns recommendation history', type: [recommendation_dto_1.RecommendationHistoryItemDto] }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __param(3, (0, common_1.Query)('skillId')),
    __param(4, (0, common_1.Query)('completed', new common_1.ParseBoolPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String, Boolean]),
    __metadata("design:returntype", Promise)
], RecommendationsController.prototype, "getRecommendationHistory", null);
__decorate([
    (0, common_1.Get)('resources'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available recommendation resources' }),
    (0, swagger_1.ApiQuery)({ name: 'skillId', required: false, description: 'Filter by associated skill ID (Not currently implemented in service)', type: String, format: 'uuid' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, description: 'Filter by resource type', enum: recommendation_dto_1.RecommendationType }),
    (0, swagger_1.ApiQuery)({ name: 'gradeLevel', required: false, description: 'Filter by grade level', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns available recommendation resources', type: [recommendation_dto_1.RecommendationResourceDto] }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Query)('skillId')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('gradeLevel')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], RecommendationsController.prototype, "getRecommendationResources", null);
__decorate([
    (0, common_1.Post)('resources'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new recommendation resource (Admin only)' }),
    (0, swagger_1.ApiBody)({ type: recommendation_dto_1.CreateResourceRequestDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Resource created successfully', type: recommendation_dto_1.RecommendationResourceDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, recommendation_dto_1.CreateResourceRequestDto]),
    __metadata("design:returntype", Promise)
], RecommendationsController.prototype, "createRecommendationResource", null);
__decorate([
    (0, common_1.Get)('llm/info'),
    (0, swagger_1.ApiOperation)({ summary: 'Get information about configured LLM providers' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'LLM configuration details', type: LlmInfoResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RecommendationsController.prototype, "getLlmInfo", null);
__decorate([
    (0, common_1.Post)('llm/select'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Select the default LLM provider (Admin only)' }),
    (0, swagger_1.ApiBody)({ type: SelectLlmRequestDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Default LLM provider updated', type: SimpleSuccessResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid provider specified' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, SelectLlmRequestDto]),
    __metadata("design:returntype", Promise)
], RecommendationsController.prototype, "selectLlmProvider", null);
__decorate([
    (0, common_1.Get)('llm/cache/stats'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get LLM cache statistics (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'LLM cache statistics', type: CacheStatsResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RecommendationsController.prototype, "getLlmCacheStats", null);
__decorate([
    (0, common_1.Post)('llm/cache/clear'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Clear the LLM cache (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'LLM cache cleared', type: SimpleSuccessResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RecommendationsController.prototype, "clearLlmCache", null);
__decorate([
    (0, common_1.Post)('llm/cache/metrics/reset'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Reset LLM cache metrics (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'LLM cache metrics reset', type: SimpleSuccessResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RecommendationsController.prototype, "resetLlmCacheMetrics", null);
__decorate([
    (0, common_1.Put)('llm/config'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update LLM provider configuration (Admin only)' }),
    (0, swagger_1.ApiBody)({ type: UpdateLlmConfigRequestDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'LLM configuration updated', type: UpdateConfigResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid configuration' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UpdateLlmConfigRequestDto]),
    __metadata("design:returntype", Promise)
], RecommendationsController.prototype, "updateLlmConfig", null);
__decorate([
    (0, common_1.Get)('ai/explain/:skillId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get AI explanation for a skill gap' }),
    (0, swagger_1.ApiParam)({ name: 'skillId', description: 'Skill ID (UUID)', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns AI-generated explanation for the skill gap', type: recommendation_dto_1.SkillGapExplanationResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Skill or user score not found' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'AI generation failed' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('skillId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RecommendationsController.prototype, "getAiSkillGapExplanation", null);
__decorate([
    (0, common_1.Get)('/metrics/ai'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get AI recommendation metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: AiMetricsResponseDto }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RecommendationsController.prototype, "getAiMetrics", null);
__decorate([
    (0, common_1.Post)('/metrics/ai/reset'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Reset AI metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: SimpleSuccessResponseDto }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RecommendationsController.prototype, "resetAiMetrics", null);
__decorate([
    (0, common_1.Get)('metrics/llm'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get LLM response metrics (Admin only)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns metrics about LLM response generation',
        type: LlmMetricsResponseDto,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RecommendationsController.prototype, "getLlmMetrics", null);
__decorate([
    (0, common_1.Post)('metrics/llm/reset'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Reset LLM response metrics (Admin only)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'LLM metrics have been reset',
        type: SimpleSuccessResponseDto,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RecommendationsController.prototype, "resetLlmMetrics", null);
__decorate([
    (0, common_1.Post)(':recommendationId/feedback'),
    (0, swagger_1.ApiOperation)({ summary: 'Add feedback for a recommendation' }),
    (0, swagger_1.ApiParam)({ name: 'recommendationId', description: 'Recommendation ID (UUID)', type: String }),
    (0, swagger_1.ApiBody)({ type: recommendation_feedback_dto_1.CreateRecommendationFeedbackDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Feedback added successfully', type: recommendation_feedback_dto_1.RecommendationFeedbackResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Recommendation not found' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('recommendationId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, recommendation_feedback_dto_1.CreateRecommendationFeedbackDto]),
    __metadata("design:returntype", Promise)
], RecommendationsController.prototype, "addRecommendationFeedback", null);
__decorate([
    (0, common_1.Get)(':recommendationId/feedback'),
    (0, swagger_1.ApiOperation)({ summary: 'Get feedback for a recommendation' }),
    (0, swagger_1.ApiParam)({ name: 'recommendationId', description: 'Recommendation ID (UUID)', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns feedback for the recommendation', type: [recommendation_feedback_dto_1.RecommendationFeedbackResponseDto] }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Recommendation not found' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('recommendationId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RecommendationsController.prototype, "getRecommendationFeedback", null);
__decorate([
    (0, common_1.Get)('feedback/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get feedback statistics for user recommendations' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns feedback statistics' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RecommendationsController.prototype, "getUserFeedbackStats", null);
exports.RecommendationsController = RecommendationsController = RecommendationsController_1 = __decorate([
    (0, swagger_1.ApiTags)('Recommendations'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('recommendations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [recommendations_service_1.RecommendationsService,
        llm_factory_service_1.LlmFactoryService,
        ai_recommendation_service_1.AiRecommendationService,
        ai_metrics_service_1.AiMetricsService])
], RecommendationsController);
//# sourceMappingURL=recommendations.controller.js.map