import { RedisService } from '../redis.service';
interface AiPerformanceMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    cacheHits: number;
    cacheMisses: number;
    errorsByType: Record<string, number>;
    recentErrors: Array<{
        code: string;
        message: string;
        timestamp: Date;
        userId: string;
        skillId: string;
        attempt: number;
        provider: string;
    }>;
    successRate?: number;
    cacheHitRate?: number;
}
export declare class AiMetricsService {
    private readonly redisService;
    private readonly logger;
    private readonly METRICS_KEY;
    private readonly MAX_RECENT_ERRORS;
    private metrics;
    constructor(redisService: RedisService);
    private loadMetrics;
    private saveMetrics;
    recordRequest(success: boolean, responseTime: number, fromCache: boolean, error?: {
        code: string;
        message: string;
        userId: string;
        skillId: string;
        attempt: number;
        provider: string;
    }): Promise<void>;
    getMetrics(): Promise<AiPerformanceMetrics>;
    resetMetrics(): Promise<void>;
}
export {};
