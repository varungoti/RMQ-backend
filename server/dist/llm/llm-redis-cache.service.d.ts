import { ConfigService } from '@nestjs/config';
import { LlmResponse } from 'src/dto/llm-provider.dto';
import { Cache } from 'cache-manager';
import { LlmCacheService } from './llm-cache.service';
import { ILlmCacheService } from './llm-provider.service';
interface CacheMetrics {
    hits: number;
    misses: number;
    totalRequests: number;
    evictions: number;
    expirations: number;
    hitRatio: number;
}
export declare class LlmRedisCacheService implements ILlmCacheService {
    private configService;
    private cacheManager;
    private inMemoryCache;
    private readonly logger;
    private readonly enabled;
    private readonly inMemoryFallback;
    private readonly ttlSeconds;
    private readonly maxCacheSize;
    private metrics;
    constructor(configService: ConfigService, cacheManager: Cache, inMemoryCache: LlmCacheService);
    private normalizePrompt;
    private generateCacheKey;
    get(prompt: string, systemPrompt: string | undefined, provider: string, model: string): Promise<LlmResponse | null>;
    private calculateHitRatio;
    set(prompt: string, systemPrompt: string | undefined, provider: string, model: string, response: LlmResponse): Promise<void>;
    getStats(): Promise<{
        enabled: boolean;
        redisConnected: boolean;
        fallbackEnabled: boolean;
        ttlSeconds: number;
        metrics: CacheMetrics;
        inMemoryStats?: any;
    }>;
    clearCache(): Promise<void>;
    resetMetrics(): void;
    clearProviderCache(provider: string): Promise<void>;
    handleClearCacheEvent(): Promise<void>;
    someOtherMethodRequiringCacheReset(): Promise<void>;
}
export {};
