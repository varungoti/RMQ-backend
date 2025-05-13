import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { LlmRedisCacheService } from './llm-redis-cache.service';
import { LlmCacheService } from './llm-cache.service';

// Define the Redis store configuration type
type RedisStoreConfig = {
  store: string;
  host: string;
  port: number;
  ttl: number;
  max: number;
  password: string | undefined;
};

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        // Get Redis configuration from environment
        const redisEnabled = configService.get<boolean>('REDIS_CACHE_ENABLED') || false;
        
        // Only configure Redis if enabled
        if (redisEnabled) {
          const redisConfig: RedisStoreConfig = {
            store: 'redis',
            host: configService.get<string>('REDIS_HOST') || 'localhost',
            port: configService.get<number>('REDIS_PORT') || 6379,
            ttl: configService.get<number>('REDIS_CACHE_TTL_SECONDS') || 3600, // 1 hour default
            max: configService.get<number>('REDIS_CACHE_MAX_ITEMS') || 1000,
            password: configService.get<string>('REDIS_PASSWORD') || undefined,
          };
          return redisConfig;
        }
        
        // For in-memory cache, make it match the RedisStoreConfig interface structure
        // but with different values
        const inMemoryConfig: any = {
          ttl: configService.get<number>('LLM_CACHE_TTL_SECONDS') || 3600,
          max: configService.get<number>('LLM_CACHE_MAX_SIZE') || 1000,
        };
        
        return inMemoryConfig;
      },
    }),
  ],
  providers: [LlmRedisCacheService, LlmCacheService],
  exports: [LlmRedisCacheService, CacheModule],
})
export class LlmRedisCacheModule {} 