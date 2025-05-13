import { ConfigService } from '@nestjs/config';
import { LlmResponse } from 'src/dto/llm-provider.dto';
import { ILlmCacheService } from './llm-provider.service';
interface CacheMetrics {
    hits: number;
    misses: number;
    totalRequests: number;
    evictions: number;
    expirations: number;
    hitRatio: number;
}
export declare class LlmCacheService implements ILlmCacheService {
    private configService;
    private readonly logger;
    private readonly cache;
    private readonly ttlMs;
    private readonly enabled;
    private readonly maxCacheSize;
    private metrics;
    constructor(configService: ConfigService);
    private normalizePrompt;
    private generateCacheKey;
    get(prompt: string, systemPrompt: string | undefined, provider: string, model: string): LlmResponse | null;
    private calculateHitRatio;
    set(prompt: string, systemPrompt: string | undefined, provider: string, model: string, response: LlmResponse): void;
    private evictOldestEntry;
    private cleanupExpiredEntries;
    getStats(): {
        enabled: boolean;
        size: number;
        maxSize: number;
        ttlSeconds: number;
        metrics: CacheMetrics;
    };
    clearCache(): void;
    resetMetrics(): void;
    clearProviderCache(provider: string): void;
}
export {};
