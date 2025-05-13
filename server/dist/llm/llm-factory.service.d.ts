import { ConfigService } from '@nestjs/config';
import { LlmCacheService } from './llm-cache.service';
import { LlmRedisCacheService } from './llm-redis-cache.service';
import { LlmProviderConfig, LlmProviderType } from 'src/dto/llm-provider.dto';
import { LlmProviderService } from './llm-provider.service';
export declare class LlmFactoryService {
    private configService;
    private cacheService;
    private redisCacheService?;
    private readonly logger;
    private providers;
    private defaultProvider;
    constructor(configService: ConfigService, cacheService: LlmCacheService, redisCacheService?: LlmRedisCacheService);
    private initializeProviders;
    getProvider(type: LlmProviderType): LlmProviderService | null;
    getDefaultProvider(): LlmProviderService;
    getAllProviders(): Map<LlmProviderType, LlmProviderService>;
    isAnyProviderEnabled(): boolean;
    setDefaultProvider(type: LlmProviderType): boolean;
    getCacheStats(): Promise<{
        enabled: boolean;
        size: number;
        maxSize: number;
        ttlSeconds: number;
        metrics: any;
    }>;
    clearCache(): Promise<void>;
    resetCacheMetrics(): Promise<void>;
    updateProviderConfig(type: LlmProviderType, config: Partial<LlmProviderConfig>): boolean;
    invalidateProviderCache(type: LlmProviderType): Promise<void>;
}
