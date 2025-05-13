import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisKey } from 'ioredis';

type SetCommandOptions = 'EX' | 'PX' | 'KEEPTTL' | 'NX' | 'XX';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redis: Redis | null = null;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get<boolean>('REDIS_CACHE_ENABLED', false);
    
    if (this.enabled) {
      try {
        this.redis = new Redis({
          host: this.configService.get<string>('REDIS_HOST', 'localhost'),
          port: this.configService.get<number>('REDIS_PORT', 6379),
          password: this.configService.get<string>('REDIS_PASSWORD'),
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
      } catch (error) {
        this.logger.error(`Failed to initialize Redis: ${error.message}`, error.stack);
      }
    } else {
      this.logger.log('Redis cache is disabled');
    }
  }

  isEnabled(): boolean {
    return this.enabled && this.redis !== null;
  }

  async get(key: RedisKey): Promise<string | null> {
    if (!this.isEnabled()) {
      return null;
    }

    try {
      return await this.redis!.get(key);
    } catch (error) {
      this.logger.error(`Redis get error for key ${key}: ${error.message}`, error.stack);
      return null;
    }
  }

  async setWithExpiry(key: RedisKey, value: string, ttlMilliseconds: number): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    try {
      await this.redis!.set(key, value, 'PX', ttlMilliseconds);
    } catch (error) {
      this.logger.error(`Redis set error for key ${key}: ${error.message}`, error.stack);
    }
  }

  async set(key: RedisKey, value: string): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    try {
      await this.redis!.set(key, value);
    } catch (error) {
      this.logger.error(`Redis set error for key ${key}: ${error.message}`, error.stack);
    }
  }

  async del(key: RedisKey): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    try {
      await this.redis!.del(key);
    } catch (error) {
      this.logger.error(`Redis del error for key ${key}: ${error.message}`, error.stack);
    }
  }

  async flushAll(): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    try {
      await this.redis!.flushall();
    } catch (error) {
      this.logger.error(`Redis flushall error: ${error.message}`, error.stack);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch (error) {
        this.logger.error(`Redis disconnect error: ${error.message}`, error.stack);
      }
    }
  }
} 