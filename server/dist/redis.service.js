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
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
let RedisService = RedisService_1 = class RedisService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(RedisService_1.name);
        this.redis = null;
        this.enabled = this.configService.get('REDIS_CACHE_ENABLED', false);
        if (this.enabled) {
            try {
                this.redis = new ioredis_1.default({
                    host: this.configService.get('REDIS_HOST', 'localhost'),
                    port: this.configService.get('REDIS_PORT', 6379),
                    password: this.configService.get('REDIS_PASSWORD'),
                    retryStrategy: (times) => {
                        const delay = Math.min(times * 50, 2000);
                        return delay;
                    },
                });
                this.redis.on('error', (error) => {
                    this.logger.error(`Redis error: ${error.message}`, error.stack);
                });
                this.redis.on('connect', () => {
                    this.logger.log('Successfully connected to Redis');
                });
            }
            catch (error) {
                this.logger.error(`Failed to initialize Redis: ${error.message}`, error.stack);
            }
        }
        else {
            this.logger.log('Redis cache is disabled');
        }
    }
    isEnabled() {
        return this.enabled && this.redis !== null;
    }
    async get(key) {
        if (!this.isEnabled()) {
            return null;
        }
        try {
            return await this.redis.get(key);
        }
        catch (error) {
            this.logger.error(`Redis get error for key ${key}: ${error.message}`, error.stack);
            return null;
        }
    }
    async setWithExpiry(key, value, ttlMilliseconds) {
        if (!this.isEnabled()) {
            return;
        }
        try {
            await this.redis.set(key, value, 'PX', ttlMilliseconds);
        }
        catch (error) {
            this.logger.error(`Redis set error for key ${key}: ${error.message}`, error.stack);
        }
    }
    async set(key, value) {
        if (!this.isEnabled()) {
            return;
        }
        try {
            await this.redis.set(key, value);
        }
        catch (error) {
            this.logger.error(`Redis set error for key ${key}: ${error.message}`, error.stack);
        }
    }
    async del(key) {
        if (!this.isEnabled()) {
            return;
        }
        try {
            await this.redis.del(key);
        }
        catch (error) {
            this.logger.error(`Redis del error for key ${key}: ${error.message}`, error.stack);
        }
    }
    async flushAll() {
        if (!this.isEnabled()) {
            return;
        }
        try {
            await this.redis.flushall();
        }
        catch (error) {
            this.logger.error(`Redis flushall error: ${error.message}`, error.stack);
        }
    }
    async onModuleDestroy() {
        if (this.redis) {
            try {
                await this.redis.quit();
            }
            catch (error) {
                this.logger.error(`Redis disconnect error: ${error.message}`, error.stack);
            }
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map