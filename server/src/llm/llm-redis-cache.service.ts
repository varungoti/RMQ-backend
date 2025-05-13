import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmResponse } from '../dto/llm-provider.dto';
import * as crypto from 'crypto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
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

const MAX_PROMPT_LENGTH = 1000; // Maximum length for normalized prompts to keep cache keys reasonable

@Injectable()
export class LlmRedisCacheService implements ILlmCacheService {
  private readonly logger = new Logger(LlmRedisCacheService.name);
  private readonly enabled: boolean;
  private readonly inMemoryFallback: boolean;
  private readonly ttlSeconds: number;
  private readonly maxCacheSize: number;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    evictions: 0,
    expirations: 0,
    hitRatio: 0
  };

  constructor(
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private inMemoryCache: LlmCacheService
  ) {
    this.enabled = this.configService.get<boolean>('REDIS_CACHE_ENABLED') || false;
    this.inMemoryFallback = this.configService.get<boolean>('LLM_CACHE_ENABLED') !== false;
    this.ttlSeconds = this.configService.get<number>('REDIS_CACHE_TTL_SECONDS') || 3600;
    this.maxCacheSize = this.configService.get<number>('REDIS_CACHE_MAX_ITEMS') || 1000;
    
    if (this.enabled) {
      this.logger.log(`Redis Cache initialized with TTL: ${this.ttlSeconds}s, Max Size: ${this.maxCacheSize}`);
    } else if (this.inMemoryFallback) {
      this.logger.log('Redis Cache is disabled, using in-memory cache fallback');
    } else {
      this.logger.log('All caching is disabled');
    }
  }

  /**
   * Normalize a prompt to improve cache hit rates by standardizing format
   * This handles whitespace, capitalization, and other minor variations
   */
  private normalizePrompt(prompt: string): string {
    if (!prompt) return '';
    
    const normalized = prompt
      // Convert to lowercase
      .toLowerCase()
      // Normalize whitespace (replace multiple spaces, tabs, newlines with single space)
      .replace(/\s+/g, ' ')
      // Trim leading/trailing whitespace
      .trim()
      // Remove punctuation that doesn't affect meaning
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      // Remove extra quotes
      .replace(/"|'/g, '');
      
    // Handle very long prompts by truncating but preserving essence
    if (normalized.length > MAX_PROMPT_LENGTH) {
      // Take first part + digest of full content + last part
      const firstPart = normalized.substring(0, MAX_PROMPT_LENGTH / 2);
      const lastPart = normalized.substring(normalized.length - MAX_PROMPT_LENGTH / 2);
      const middleHash = crypto.createHash('md5').update(normalized).digest('hex').substring(0, 8);
      
      return `${firstPart}___${middleHash}___${lastPart}`;
    }
    
    return normalized;
  }

  /**
   * Generate a deterministic cache key from prompt parameters
   */
  private generateCacheKey(prompt: string, systemPrompt: string | undefined, provider: string, model: string): string {
    // Normalize prompts to improve cache hit rates
    const normalizedPrompt = this.normalizePrompt(prompt);
    const normalizedSystemPrompt = systemPrompt ? this.normalizePrompt(systemPrompt) : '';
    
    // Create a deterministic string that represents the request
    const requestString = JSON.stringify({
      prompt: normalizedPrompt,
      systemPrompt: normalizedSystemPrompt,
      provider,
      model,
    });
    
    // Create a hash of the request string
    return crypto.createHash('md5').update(requestString).digest('hex');
  }

  /**
   * Get a response from the cache
   */
  async get(prompt: string, systemPrompt: string | undefined, provider: string, model: string): Promise<LlmResponse | null> {
    // Increment total requests counter
    this.metrics.totalRequests++;
    
    if (!this.enabled) {
      // If Redis cache is disabled, try in-memory cache if enabled
      if (this.inMemoryFallback) {
        return this.inMemoryCache.get(prompt, systemPrompt, provider, model);
      }
      // If all caching is disabled, return null
      this.metrics.misses++;
      return null;
    }

    const cacheKey = this.generateCacheKey(prompt, systemPrompt, provider, model);
    
    try {
      const cachedValue = await this.cacheManager.get<LlmResponse>(cacheKey);
      
      if (cachedValue) {
        this.metrics.hits++;
        this.calculateHitRatio();
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return cachedValue;
      }
    } catch (error) {
      this.logger.error(`Error retrieving from Redis cache: ${error.message}`, error.stack);
      // On Redis error, fall back to in-memory cache if enabled
      if (this.inMemoryFallback) {
        this.logger.log('Falling back to in-memory cache due to Redis error');
        return this.inMemoryCache.get(prompt, systemPrompt, provider, model);
      }
    }
    
    this.metrics.misses++;
    this.calculateHitRatio();
    return null;
  }
  
  /**
   * Calculate hit ratio for metrics
   */
  private calculateHitRatio(): void {
    this.metrics.hitRatio = this.metrics.totalRequests > 0 
      ? this.metrics.hits / this.metrics.totalRequests 
      : 0;
  }

  /**
   * Store a response in the cache
   */
  async set(prompt: string, systemPrompt: string | undefined, provider: string, model: string, response: LlmResponse): Promise<void> {
    if (!this.enabled) {
      // If Redis cache is disabled, try in-memory cache if enabled
      if (this.inMemoryFallback && !response.isError) {
        this.inMemoryCache.set(prompt, systemPrompt, provider, model, response);
      }
      return;
    }

    if (response.isError) {
      return;
    }

    const cacheKey = this.generateCacheKey(prompt, systemPrompt, provider, model);
    
    try {
      await this.cacheManager.set(cacheKey, response, this.ttlSeconds * 1000);
      this.logger.debug(`Cached response in Redis for key: ${cacheKey}`);
    } catch (error) {
      this.logger.error(`Error storing in Redis cache: ${error.message}`, error.stack);
      // On Redis error, fall back to in-memory cache
      if (this.inMemoryFallback) {
        this.logger.log('Falling back to in-memory cache for storage due to Redis error');
        this.inMemoryCache.set(prompt, systemPrompt, provider, model, response);
      }
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ 
    enabled: boolean; 
    redisConnected: boolean;
    fallbackEnabled: boolean;
    ttlSeconds: number; 
    metrics: CacheMetrics;
    inMemoryStats?: any;
  }> {
    let redisConnected = false;
    
    if (this.enabled) {
      try {
        // Simple operation to check if Redis is connected
        await this.cacheManager.set('__redis_test_key__', 'test', 1000);
        await this.cacheManager.get('__redis_test_key__');
        redisConnected = true;
      } catch (error) {
        this.logger.error('Redis connection check failed', error.stack);
      }
    }
    
    const stats = {
      enabled: this.enabled,
      redisConnected,
      fallbackEnabled: this.inMemoryFallback,
      ttlSeconds: this.ttlSeconds,
      metrics: this.metrics,
    };
    
    // Add in-memory cache stats if fallback is enabled
    if (this.inMemoryFallback) {
      stats['inMemoryStats'] = this.inMemoryCache.getStats();
    }
    
    return stats;
  }

  /**
   * Clears the entire cache. 
   * NOTE: This might be resource-intensive on large caches.
   */
  async clearCache(): Promise<void> {
    this.logger.log('Clearing the entire LLM cache...');
    if (!this.enabled) {
      // If Redis cache is disabled, try in-memory cache if enabled
      if (this.inMemoryFallback) {
        this.inMemoryCache.clearCache();
      }
      return;
    }
    try {
      // Attempt to access the underlying store property ('store')
      const store = (this.cacheManager as any).store; // Use type assertion
      if (store && typeof store.reset === 'function') {
        await store.reset(); 
        this.logger.log('Successfully cleared cache via store.reset()');
      } else {
        this.logger.warn('Cache store or its reset method not found, cache not cleared.');
      }
    } catch (error) {
      this.logger.error(`Failed to clear cache via store: ${error.message}`, error.stack);
      // If Redis cache is disabled, try in-memory cache if enabled
      if (this.inMemoryFallback) {
        this.logger.log('Falling back to in-memory cache for clearing');
        this.inMemoryCache.clearCache();
      }
    }
  }

  /**
   * Resets cache metrics.
   */
  resetMetrics(): void {
    this.logger.log('Resetting cache metrics...');
    this.metrics = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      evictions: 0,
      expirations: 0,
      hitRatio: 0
    };
    
    // Also reset in-memory cache metrics if fallback is enabled
    if (this.inMemoryFallback) {
      this.inMemoryCache.resetMetrics();
    }
    
    this.logger.log('Cache metrics reset.');
  }

  /**
   * Clear cache entries for a specific provider
   * Note: For Redis, this clears the entire cache.
   */
  async clearProviderCache(provider: string): Promise<void> {
    if (!this.enabled) {
      // If Redis cache is disabled, try in-memory cache if enabled
      if (this.inMemoryFallback) {
        this.inMemoryCache.clearProviderCache(provider);
      }
      return;
    }

    this.logger.log(`Clearing entire Redis cache (triggered by clearProviderCache for ${provider})`);
    
    try {
      // Attempt to access the underlying store property ('store')
      const store = (this.cacheManager as any).store; // Use type assertion
      if (store && typeof store.reset === 'function') {
        await store.reset();
        this.logger.log(`Successfully cleared entire cache via store.reset() (for provider ${provider})`);
      } else {
        this.logger.warn('Cache store or its reset method not found, cache not cleared.');
      }
    } catch (error) {
      this.logger.error(`Error clearing Redis cache via store for provider ${provider}: ${error.message}`, error.stack);
      // If Redis cache is disabled, try in-memory cache if enabled
      if (this.inMemoryFallback) {
        this.logger.log(`Falling back to in-memory cache clearing for provider ${provider}`);
        this.inMemoryCache.clearProviderCache(provider);
      }
    }
  }

  // Method that might have been called by an external trigger or schedule
  async handleClearCacheEvent() {
    await this.clearCache();
  }

  // Example usage within another method (replace with actual context if different)
  // Ensure ALL calls to reset() are commented or removed
  async someOtherMethodRequiringCacheReset() {
    // ... some logic ...
    this.logger.warn('Performing cache clear as part of someOtherMethodRequiringCacheReset');
    await this.clearCache(); // Call the fixed clearCache method
    // ... more logic ...
  }

  // Search for any other potential calls to this.cacheManager.reset() within this class
  // and comment them out as well. Ensure none remain.
} 