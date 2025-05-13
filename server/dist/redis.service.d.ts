import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisKey } from 'ioredis';
export declare class RedisService implements OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private redis;
    private readonly enabled;
    constructor(configService: ConfigService);
    isEnabled(): boolean;
    get(key: RedisKey): Promise<string | null>;
    setWithExpiry(key: RedisKey, value: string, ttlMilliseconds: number): Promise<void>;
    set(key: RedisKey, value: string): Promise<void>;
    del(key: RedisKey): Promise<void>;
    flushAll(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
