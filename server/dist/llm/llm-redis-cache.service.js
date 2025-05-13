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
var LlmRedisCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmRedisCacheService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = require("crypto");
const cache_manager_1 = require("@nestjs/cache-manager");
const common_2 = require("@nestjs/common");
const llm_cache_service_1 = require("./llm-cache.service");
const MAX_PROMPT_LENGTH = 1000;
let LlmRedisCacheService = LlmRedisCacheService_1 = class LlmRedisCacheService {
    constructor(configService, cacheManager, inMemoryCache) {
        this.configService = configService;
        this.cacheManager = cacheManager;
        this.inMemoryCache = inMemoryCache;
        this.logger = new common_1.Logger(LlmRedisCacheService_1.name);
        this.metrics = {
            hits: 0,
            misses: 0,
            totalRequests: 0,
            evictions: 0,
            expirations: 0,
            hitRatio: 0
        };
        this.enabled = this.configService.get('REDIS_CACHE_ENABLED') || false;
        this.inMemoryFallback = this.configService.get('LLM_CACHE_ENABLED') !== false;
        this.ttlSeconds = this.configService.get('REDIS_CACHE_TTL_SECONDS') || 3600;
        this.maxCacheSize = this.configService.get('REDIS_CACHE_MAX_ITEMS') || 1000;
        if (this.enabled) {
            this.logger.log(`Redis Cache initialized with TTL: ${this.ttlSeconds}s, Max Size: ${this.maxCacheSize}`);
        }
        else if (this.inMemoryFallback) {
            this.logger.log('Redis Cache is disabled, using in-memory cache fallback');
        }
        else {
            this.logger.log('All caching is disabled');
        }
    }
    normalizePrompt(prompt) {
        if (!prompt)
            return '';
        const normalized = prompt
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
            .replace(/"|'/g, '');
        if (normalized.length > MAX_PROMPT_LENGTH) {
            const firstPart = normalized.substring(0, MAX_PROMPT_LENGTH / 2);
            const lastPart = normalized.substring(normalized.length - MAX_PROMPT_LENGTH / 2);
            const middleHash = crypto.createHash('md5').update(normalized).digest('hex').substring(0, 8);
            return `${firstPart}___${middleHash}___${lastPart}`;
        }
        return normalized;
    }
    generateCacheKey(prompt, systemPrompt, provider, model) {
        const normalizedPrompt = this.normalizePrompt(prompt);
        const normalizedSystemPrompt = systemPrompt ? this.normalizePrompt(systemPrompt) : '';
        const requestString = JSON.stringify({
            prompt: normalizedPrompt,
            systemPrompt: normalizedSystemPrompt,
            provider,
            model,
        });
        return crypto.createHash('md5').update(requestString).digest('hex');
    }
    async get(prompt, systemPrompt, provider, model) {
        this.metrics.totalRequests++;
        if (!this.enabled) {
            if (this.inMemoryFallback) {
                return this.inMemoryCache.get(prompt, systemPrompt, provider, model);
            }
            this.metrics.misses++;
            return null;
        }
        const cacheKey = this.generateCacheKey(prompt, systemPrompt, provider, model);
        try {
            const cachedValue = await this.cacheManager.get(cacheKey);
            if (cachedValue) {
                this.metrics.hits++;
                this.calculateHitRatio();
                this.logger.debug(`Cache hit for key: ${cacheKey}`);
                return cachedValue;
            }
        }
        catch (error) {
            this.logger.error(`Error retrieving from Redis cache: ${error.message}`, error.stack);
            if (this.inMemoryFallback) {
                this.logger.log('Falling back to in-memory cache due to Redis error');
                return this.inMemoryCache.get(prompt, systemPrompt, provider, model);
            }
        }
        this.metrics.misses++;
        this.calculateHitRatio();
        return null;
    }
    calculateHitRatio() {
        this.metrics.hitRatio = this.metrics.totalRequests > 0
            ? this.metrics.hits / this.metrics.totalRequests
            : 0;
    }
    async set(prompt, systemPrompt, provider, model, response) {
        if (!this.enabled) {
            if (this.inMemoryFallback && !response.isError) {
                this.inMemoryCache.set(prompt, systemPrompt, provider, model, response);
            }
            return;
        }
        if (response.isError) {
            return;
        }
        const cacheKey = this.generateCacheKey(prompt, systemPrompt, provider, model);
        try {
            await this.cacheManager.set(cacheKey, response, this.ttlSeconds * 1000);
            this.logger.debug(`Cached response in Redis for key: ${cacheKey}`);
        }
        catch (error) {
            this.logger.error(`Error storing in Redis cache: ${error.message}`, error.stack);
            if (this.inMemoryFallback) {
                this.logger.log('Falling back to in-memory cache for storage due to Redis error');
                this.inMemoryCache.set(prompt, systemPrompt, provider, model, response);
            }
        }
    }
    async getStats() {
        let redisConnected = false;
        if (this.enabled) {
            try {
                await this.cacheManager.set('__redis_test_key__', 'test', 1000);
                await this.cacheManager.get('__redis_test_key__');
                redisConnected = true;
            }
            catch (error) {
                this.logger.error('Redis connection check failed', error.stack);
            }
        }
        const stats = {
            enabled: this.enabled,
            redisConnected,
            fallbackEnabled: this.inMemoryFallback,
            ttlSeconds: this.ttlSeconds,
            metrics: this.metrics,
        };
        if (this.inMemoryFallback) {
            stats['inMemoryStats'] = this.inMemoryCache.getStats();
        }
        return stats;
    }
    async clearCache() {
        this.logger.log('Clearing the entire LLM cache...');
        if (!this.enabled) {
            if (this.inMemoryFallback) {
                this.inMemoryCache.clearCache();
            }
            return;
        }
        try {
            const store = this.cacheManager.store;
            if (store && typeof store.reset === 'function') {
                await store.reset();
                this.logger.log('Successfully cleared cache via store.reset()');
            }
            else {
                this.logger.warn('Cache store or its reset method not found, cache not cleared.');
            }
        }
        catch (error) {
            this.logger.error(`Failed to clear cache via store: ${error.message}`, error.stack);
            if (this.inMemoryFallback) {
                this.logger.log('Falling back to in-memory cache for clearing');
                this.inMemoryCache.clearCache();
            }
        }
    }
    resetMetrics() {
        this.logger.log('Resetting cache metrics...');
        this.metrics = {
            hits: 0,
            misses: 0,
            totalRequests: 0,
            evictions: 0,
            expirations: 0,
            hitRatio: 0
        };
        if (this.inMemoryFallback) {
            this.inMemoryCache.resetMetrics();
        }
        this.logger.log('Cache metrics reset.');
    }
    async clearProviderCache(provider) {
        if (!this.enabled) {
            if (this.inMemoryFallback) {
                this.inMemoryCache.clearProviderCache(provider);
            }
            return;
        }
        this.logger.log(`Clearing entire Redis cache (triggered by clearProviderCache for ${provider})`);
        try {
            const store = this.cacheManager.store;
            if (store && typeof store.reset === 'function') {
                await store.reset();
                this.logger.log(`Successfully cleared entire cache via store.reset() (for provider ${provider})`);
            }
            else {
                this.logger.warn('Cache store or its reset method not found, cache not cleared.');
            }
        }
        catch (error) {
            this.logger.error(`Error clearing Redis cache via store for provider ${provider}: ${error.message}`, error.stack);
            if (this.inMemoryFallback) {
                this.logger.log(`Falling back to in-memory cache clearing for provider ${provider}`);
                this.inMemoryCache.clearProviderCache(provider);
            }
        }
    }
    async handleClearCacheEvent() {
        await this.clearCache();
    }
    async someOtherMethodRequiringCacheReset() {
        this.logger.warn('Performing cache clear as part of someOtherMethodRequiringCacheReset');
        await this.clearCache();
    }
};
exports.LlmRedisCacheService = LlmRedisCacheService;
exports.LlmRedisCacheService = LlmRedisCacheService = LlmRedisCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_2.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [config_1.ConfigService, Object, llm_cache_service_1.LlmCacheService])
], LlmRedisCacheService);
//# sourceMappingURL=llm-redis-cache.service.js.map