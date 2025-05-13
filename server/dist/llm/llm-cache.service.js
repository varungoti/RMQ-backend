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
var LlmCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmCacheService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = require("crypto");
const MAX_PROMPT_LENGTH = 1000;
let LlmCacheService = LlmCacheService_1 = class LlmCacheService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(LlmCacheService_1.name);
        this.cache = new Map();
        this.metrics = {
            hits: 0,
            misses: 0,
            totalRequests: 0,
            evictions: 0,
            expirations: 0,
            hitRatio: 0
        };
        this.ttlMs = this.configService.get('LLM_CACHE_TTL_SECONDS') * 1000 || 3600 * 1000;
        this.enabled = this.configService.get('LLM_CACHE_ENABLED') !== false;
        this.maxCacheSize = this.configService.get('LLM_CACHE_MAX_SIZE') || 1000;
        if (this.enabled) {
            this.logger.log(`LLM Cache initialized with TTL: ${this.ttlMs}ms, Max Size: ${this.maxCacheSize}`);
            setInterval(() => this.cleanupExpiredEntries(), 60 * 1000);
        }
        else {
            this.logger.log('LLM Cache is disabled');
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
    get(prompt, systemPrompt, provider, model) {
        if (!this.enabled) {
            return null;
        }
        this.metrics.totalRequests++;
        const cacheKey = this.generateCacheKey(prompt, systemPrompt, provider, model);
        const cachedItem = this.cache.get(cacheKey);
        if (!cachedItem) {
            this.metrics.misses++;
            this.metrics.hitRatio = this.calculateHitRatio();
            this.logger.debug(`Cache miss for key: ${cacheKey}`);
            return null;
        }
        if (Date.now() - cachedItem.timestamp > this.ttlMs) {
            this.metrics.misses++;
            this.metrics.expirations++;
            this.metrics.hitRatio = this.calculateHitRatio();
            this.logger.debug(`Cache entry expired for key: ${cacheKey}`);
            this.cache.delete(cacheKey);
            return null;
        }
        this.metrics.hits++;
        this.metrics.hitRatio = this.calculateHitRatio();
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return cachedItem.response;
    }
    calculateHitRatio() {
        return this.metrics.totalRequests > 0
            ? this.metrics.hits / this.metrics.totalRequests
            : 0;
    }
    set(prompt, systemPrompt, provider, model, response) {
        if (!this.enabled || response.isError) {
            return;
        }
        const cacheKey = this.generateCacheKey(prompt, systemPrompt, provider, model);
        if (this.cache.size >= this.maxCacheSize) {
            this.evictOldestEntry();
        }
        this.cache.set(cacheKey, {
            response,
            timestamp: Date.now(),
            provider,
            model,
        });
        this.logger.debug(`Cached response for key: ${cacheKey}`);
    }
    evictOldestEntry() {
        let oldestKey = null;
        let oldestTimestamp = Infinity;
        for (const [key, value] of this.cache.entries()) {
            if (value.timestamp < oldestTimestamp) {
                oldestTimestamp = value.timestamp;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.metrics.evictions++;
            this.logger.debug(`Evicted oldest cache entry: ${oldestKey}`);
        }
    }
    cleanupExpiredEntries() {
        const now = Date.now();
        let expiredCount = 0;
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.ttlMs) {
                this.cache.delete(key);
                expiredCount++;
            }
        }
        if (expiredCount > 0) {
            this.logger.debug(`Cleaned up ${expiredCount} expired cache entries`);
        }
    }
    getStats() {
        return {
            enabled: this.enabled,
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            ttlSeconds: this.ttlMs / 1000,
            metrics: { ...this.metrics }
        };
    }
    clearCache() {
        const clearedSize = this.cache.size;
        this.cache.clear();
        this.metrics.hitRatio = 0;
        this.logger.log(`Cleared cache with ${clearedSize} entries`);
    }
    resetMetrics() {
        this.metrics = {
            hits: 0,
            misses: 0,
            totalRequests: 0,
            evictions: 0,
            expirations: 0,
            hitRatio: 0
        };
        this.logger.log('Cache metrics reset');
    }
    clearProviderCache(provider) {
        if (!this.enabled) {
            return;
        }
        this.logger.log(`Clearing in-memory cache for provider: ${provider}`);
        let entriesRemoved = 0;
        const keysToDelete = [];
        for (const [key, entry] of this.cache.entries()) {
            if (entry.provider === provider) {
                keysToDelete.push(key);
            }
        }
        for (const key of keysToDelete) {
            this.cache.delete(key);
            entriesRemoved++;
        }
        this.logger.log(`Cleared ${entriesRemoved} entries from in-memory cache for provider ${provider}`);
    }
};
exports.LlmCacheService = LlmCacheService;
exports.LlmCacheService = LlmCacheService = LlmCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LlmCacheService);
//# sourceMappingURL=llm-cache.service.js.map