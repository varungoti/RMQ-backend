import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmResponse } from '../dto/llm-provider.dto';
import * as crypto from 'crypto';
import { ILlmCacheService } from './llm-provider.service';

interface CachedResponse {
  response: LlmResponse;
  timestamp: number;
  provider: string;
  model: string;
}

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
export class LlmCacheService implements ILlmCacheService {
  private readonly logger = new Logger(LlmCacheService.name);
  private readonly cache: Map<string, CachedResponse> = new Map();
  private readonly ttlMs: number; // Time-to-live in milliseconds
  private readonly enabled: boolean;
  private readonly maxCacheSize: number;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    evictions: 0,
    expirations: 0,
    hitRatio: 0
  };

  constructor(private configService: ConfigService) {
    this.ttlMs = this.configService.get<number>('LLM_CACHE_TTL_SECONDS') * 1000 || 3600 * 1000; // Default 1 hour
    this.enabled = this.configService.get<boolean>('LLM_CACHE_ENABLED') !== false; // Default true
    this.maxCacheSize = this.configService.get<number>('LLM_CACHE_MAX_SIZE') || 1000; // Default 1000 entries
    
    if (this.enabled) {
      this.logger.log(`LLM Cache initialized with TTL: ${this.ttlMs}ms, Max Size: ${this.maxCacheSize}`);
      
      // Set up periodic cleanup of expired cache entries
      setInterval(() => this.cleanupExpiredEntries(), 60 * 1000); // Run every minute
    } else {
      this.logger.log('LLM Cache is disabled');
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
   * Get a cached response if available
   */
  get(prompt: string, systemPrompt: string | undefined, provider: string, model: string): LlmResponse | null {
    if (!this.enabled) {
      return null;
    }

    this.metrics.totalRequests++;
    
    const cacheKey = this.generateCacheKey(prompt, systemPrompt, provider, model);
    const cachedItem = this.cache.get(cacheKey);
    
    if (!cachedItem) {
      this.metrics.misses++;
      this.metrics.hitRatio = this.calculateHitRatio();
      this.logger.debug(`Cache miss for key: ${cacheKey}`);
      return null;
    }
    
    // Check if the cached response has expired
    if (Date.now() - cachedItem.timestamp > this.ttlMs) {
      this.metrics.misses++;
      this.metrics.expirations++;
      this.metrics.hitRatio = this.calculateHitRatio();
      this.logger.debug(`Cache entry expired for key: ${cacheKey}`);
      this.cache.delete(cacheKey);
      return null;
    }
    
    this.metrics.hits++;
    this.metrics.hitRatio = this.calculateHitRatio();
    this.logger.debug(`Cache hit for key: ${cacheKey}`);
    return cachedItem.response;
  }

  /**
   * Calculate hit ratio
   */
  private calculateHitRatio(): number {
    return this.metrics.totalRequests > 0 
      ? this.metrics.hits / this.metrics.totalRequests 
      : 0;
  }

  /**
   * Store a response in the cache
   */
  set(prompt: string, systemPrompt: string | undefined, provider: string, model: string, response: LlmResponse): void {
    if (!this.enabled || response.isError) {
      return;
    }

    const cacheKey = this.generateCacheKey(prompt, systemPrompt, provider, model);
    
    // Check if we need to evict entries to maintain max size
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldestEntry();
    }
    
    this.cache.set(cacheKey, {
      response,
      timestamp: Date.now(),
      provider,
      model,
    });
    
    this.logger.debug(`Cached response for key: ${cacheKey}`);
  }

  /**
   * Remove oldest entry when cache reaches max size
   */
  private evictOldestEntry(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;
    
    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp < oldestTimestamp) {
        oldestTimestamp = value.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.metrics.evictions++;
      this.logger.debug(`Evicted oldest cache entry: ${oldestKey}`);
    }
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.ttlMs) {
        this.cache.delete(key);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      this.logger.debug(`Cleaned up ${expiredCount} expired cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { 
    enabled: boolean; 
    size: number; 
    maxSize: number; 
    ttlSeconds: number;
    metrics: CacheMetrics;
  } {
    return {
      enabled: this.enabled,
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      ttlSeconds: this.ttlMs / 1000,
      metrics: { ...this.metrics }
    };
  }

  /**
   * Clear the entire cache
   */
  clearCache(): void {
    const clearedSize = this.cache.size;
    this.cache.clear();
    
    // Reset metrics related to cache state
    this.metrics.hitRatio = 0;
    
    this.logger.log(`Cleared cache with ${clearedSize} entries`);
  }

  /**
   * Reset all cache metrics
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      evictions: 0,
      expirations: 0,
      hitRatio: 0
    };
    this.logger.log('Cache metrics reset');
  }

  /**
   * Clear cache entries for a specific provider
   */
  clearProviderCache(provider: string): void {
    if (!this.enabled) {
      return;
    }
    
    this.logger.log(`Clearing in-memory cache for provider: ${provider}`);
    let entriesRemoved = 0;
    
    // Get all keys that need to be deleted
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.provider === provider) {
        keysToDelete.push(key);
      }
    }
    
    // Delete the entries
    for (const key of keysToDelete) {
      this.cache.delete(key);
      entriesRemoved++;
    }
    
    this.logger.log(`Cleared ${entriesRemoved} entries from in-memory cache for provider ${provider}`);
  }
} 