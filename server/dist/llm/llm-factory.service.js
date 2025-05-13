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
var LlmFactoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmFactoryService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_provider_service_1 = require("./openai-provider.service");
const gemini_provider_service_1 = require("./gemini-provider.service");
const anthropic_provider_service_1 = require("./anthropic-provider.service");
const cohere_provider_service_1 = require("./cohere-provider.service");
const llm_cache_service_1 = require("./llm-cache.service");
const llm_redis_cache_service_1 = require("./llm-redis-cache.service");
const llm_provider_dto_1 = require("../dto/llm-provider.dto");
let LlmFactoryService = LlmFactoryService_1 = class LlmFactoryService {
    constructor(configService, cacheService, redisCacheService) {
        this.configService = configService;
        this.cacheService = cacheService;
        this.redisCacheService = redisCacheService;
        this.logger = new common_1.Logger(LlmFactoryService_1.name);
        this.providers = new Map();
        this.defaultProvider = llm_provider_dto_1.LlmProviderType.GEMINI;
        this.initializeProviders();
    }
    initializeProviders() {
        const redisEnabled = this.configService.get('REDIS_CACHE_ENABLED') || false;
        const cacheToUse = redisEnabled && this.redisCacheService ? this.redisCacheService : this.cacheService;
        this.logger.log(`Using ${redisEnabled ? 'Redis' : 'in-memory'} cache for LLM responses`);
        const openAiConfig = {
            type: llm_provider_dto_1.LlmProviderType.OPENAI,
            apiKey: this.configService.get('OPENAI_API_KEY') || '',
            model: this.configService.get('OPENAI_MODEL') || 'gpt-3.5-turbo',
            temperature: this.configService.get('OPENAI_TEMPERATURE') || 0.7,
            enabled: !!this.configService.get('USE_OPENAI'),
        };
        const openAiProvider = new openai_provider_service_1.OpenAiProviderService(openAiConfig);
        openAiProvider.setCacheService(cacheToUse);
        this.providers.set(llm_provider_dto_1.LlmProviderType.OPENAI, openAiProvider);
        const geminiConfig = {
            type: llm_provider_dto_1.LlmProviderType.GEMINI,
            apiKey: this.configService.get('GEMINI_API_KEY') || '',
            model: this.configService.get('GEMINI_MODEL') || 'gemini-2.5-pro',
            temperature: this.configService.get('GEMINI_TEMPERATURE') || 0.7,
            enabled: this.configService.get('USE_GEMINI') !== false,
        };
        const geminiProvider = new gemini_provider_service_1.GeminiProviderService(geminiConfig);
        geminiProvider.setCacheService(cacheToUse);
        this.providers.set(llm_provider_dto_1.LlmProviderType.GEMINI, geminiProvider);
        const anthropicConfig = {
            type: llm_provider_dto_1.LlmProviderType.ANTHROPIC,
            apiKey: this.configService.get('ANTHROPIC_API_KEY') || '',
            model: this.configService.get('ANTHROPIC_MODEL') || 'claude-3-haiku-20240307',
            temperature: this.configService.get('ANTHROPIC_TEMPERATURE') || 0.7,
            enabled: !!this.configService.get('USE_ANTHROPIC'),
        };
        const anthropicProvider = new anthropic_provider_service_1.AnthropicProviderService(anthropicConfig);
        anthropicProvider.setCacheService(cacheToUse);
        this.providers.set(llm_provider_dto_1.LlmProviderType.ANTHROPIC, anthropicProvider);
        const cohereConfig = {
            type: llm_provider_dto_1.LlmProviderType.COHERE,
            apiKey: this.configService.get('COHERE_API_KEY') || '',
            model: this.configService.get('COHERE_MODEL') || 'command',
            temperature: this.configService.get('COHERE_TEMPERATURE') || 0.7,
            enabled: !!this.configService.get('USE_COHERE'),
        };
        const cohereProvider = new cohere_provider_service_1.CohereProviderService(cohereConfig);
        cohereProvider.setCacheService(cacheToUse);
        this.providers.set(llm_provider_dto_1.LlmProviderType.COHERE, cohereProvider);
        const configuredDefault = this.configService.get('DEFAULT_LLM_PROVIDER');
        if (configuredDefault) {
            const providerType = configuredDefault.toLowerCase();
            if (Object.values(llm_provider_dto_1.LlmProviderType).includes(providerType)) {
                this.defaultProvider = providerType;
            }
        }
        this.logger.log(`Initialized LLM providers with default: ${this.defaultProvider}`);
        for (const [type, provider] of this.providers.entries()) {
            this.logger.log(`Provider ${type}: enabled=${provider.isEnabled()}, model=${provider.getConfig().model}`);
        }
    }
    getProvider(type) {
        return this.providers.get(type) || null;
    }
    getDefaultProvider() {
        const provider = this.providers.get(this.defaultProvider);
        if (provider && provider.isEnabled()) {
            return provider;
        }
        for (const [type, providerService] of this.providers.entries()) {
            if (providerService.isEnabled()) {
                this.logger.warn(`Default provider ${this.defaultProvider} not enabled, using ${type} instead`);
                return providerService;
            }
        }
        this.logger.warn('No enabled LLM providers found, using disabled default provider');
        return this.providers.get(this.defaultProvider);
    }
    getAllProviders() {
        return this.providers;
    }
    isAnyProviderEnabled() {
        for (const provider of this.providers.values()) {
            if (provider.isEnabled()) {
                return true;
            }
        }
        return false;
    }
    setDefaultProvider(type) {
        if (!this.providers.has(type)) {
            this.logger.error(`Cannot set default provider to ${type}: provider not found`);
            return false;
        }
        const provider = this.providers.get(type);
        if (!provider.isEnabled()) {
            this.logger.warn(`Setting default provider to ${type} but it is not enabled`);
        }
        this.logger.log(`Setting default provider from ${this.defaultProvider} to ${type}`);
        this.defaultProvider = type;
        return true;
    }
    async getCacheStats() {
        if (this.configService.get('REDIS_CACHE_ENABLED') && this.redisCacheService) {
            const redisStats = await this.redisCacheService.getStats();
            return {
                enabled: redisStats.enabled,
                size: 0,
                maxSize: 0,
                ttlSeconds: redisStats.ttlSeconds,
                metrics: redisStats.metrics
            };
        }
        return this.cacheService.getStats();
    }
    async clearCache() {
        if (this.configService.get('REDIS_CACHE_ENABLED') && this.redisCacheService) {
            await this.redisCacheService.clearCache();
            return;
        }
        this.cacheService.clearCache();
    }
    async resetCacheMetrics() {
        if (this.configService.get('REDIS_CACHE_ENABLED') && this.redisCacheService) {
            this.redisCacheService.resetMetrics();
        }
        this.cacheService.resetMetrics();
        this.logger.log('Cache metrics reset via factory service');
    }
    updateProviderConfig(type, config) {
        const provider = this.getProvider(type);
        if (!provider) {
            this.logger.warn(`Provider ${type} not found, cannot update config`);
            return false;
        }
        const oldModel = provider.getConfig().model;
        const newModel = config.model;
        provider.updateConfig(config);
        if (newModel && oldModel !== newModel) {
            this.logger.log(`Model changed from ${oldModel} to ${newModel}, invalidating cache for provider ${type}`);
            this.invalidateProviderCache(type);
        }
        return true;
    }
    async invalidateProviderCache(type) {
        this.logger.log(`Invalidating cache for provider ${type}`);
        if (this.configService.get('REDIS_CACHE_ENABLED') && this.redisCacheService) {
            await this.redisCacheService.clearProviderCache(type);
        }
        this.cacheService.clearProviderCache(type);
    }
};
exports.LlmFactoryService = LlmFactoryService;
exports.LlmFactoryService = LlmFactoryService = LlmFactoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        llm_cache_service_1.LlmCacheService,
        llm_redis_cache_service_1.LlmRedisCacheService])
], LlmFactoryService);
//# sourceMappingURL=llm-factory.service.js.map