"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmRedisCacheModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cache_manager_1 = require("@nestjs/cache-manager");
const llm_redis_cache_service_1 = require("./llm-redis-cache.service");
const llm_cache_service_1 = require("./llm-cache.service");
let LlmRedisCacheModule = class LlmRedisCacheModule {
};
exports.LlmRedisCacheModule = LlmRedisCacheModule;
exports.LlmRedisCacheModule = LlmRedisCacheModule = __decorate([
    (0, common_1.Module)({
        imports: [
            cache_manager_1.CacheModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (configService) => {
                    const redisEnabled = configService.get('REDIS_CACHE_ENABLED') || false;
                    if (redisEnabled) {
                        const redisConfig = {
                            store: 'redis',
                            host: configService.get('REDIS_HOST') || 'localhost',
                            port: configService.get('REDIS_PORT') || 6379,
                            ttl: configService.get('REDIS_CACHE_TTL_SECONDS') || 3600,
                            max: configService.get('REDIS_CACHE_MAX_ITEMS') || 1000,
                            password: configService.get('REDIS_PASSWORD') || undefined,
                        };
                        return redisConfig;
                    }
                    const inMemoryConfig = {
                        ttl: configService.get('LLM_CACHE_TTL_SECONDS') || 3600,
                        max: configService.get('LLM_CACHE_MAX_SIZE') || 1000,
                    };
                    return inMemoryConfig;
                },
            }),
        ],
        providers: [llm_redis_cache_service_1.LlmRedisCacheService, llm_cache_service_1.LlmCacheService],
        exports: [llm_redis_cache_service_1.LlmRedisCacheService, cache_manager_1.CacheModule],
    })
], LlmRedisCacheModule);
//# sourceMappingURL=llm-redis-cache.module.js.map