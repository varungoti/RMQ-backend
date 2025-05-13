import { Injectable } from '@nestjs/common';

/**
 * In-memory cache store compatible with NestJS CacheModule
 */
export class MemoryStore {
  private cache: Map<string, { value: any; ttl: number }> = new Map();

  constructor() {
    // Clean expired items periodically
    setInterval(() => this.cleanExpired(), 60000);
  }

  /**
   * Get a cached value by key
   */
  get(key: string): Promise<any> {
    const item = this.cache.get(key);
    if (!item) return Promise.resolve(null);
    
    if (item.ttl && item.ttl < Date.now()) {
      this.cache.delete(key);
      return Promise.resolve(null);
    }
    
    return Promise.resolve(item.value);
  }

  /**
   * Set a value in the cache with optional TTL
   */
  set(key: string, value: any, ttl?: number): Promise<void> {
    const ttlMs = ttl ? Date.now() + (ttl * 1000) : undefined;
    this.cache.set(key, { value, ttl: ttlMs });
    return Promise.resolve();
  }

  /**
   * Delete a cache entry by key
   */
  del(key: string): Promise<void> {
    this.cache.delete(key);
    return Promise.resolve();
  }

  /**
   * Clear all cache entries
   */
  reset(): Promise<void> {
    this.cache.clear();
    return Promise.resolve();
  }

  /**
   * Get all keys
   */
  keys(): Promise<string[]> {
    return Promise.resolve(Array.from(this.cache.keys()));
  }

  /**
   * Remove expired items
   */
  private cleanExpired(): void {
    const now = Date.now();
    this.cache.forEach((item, key) => {
      if (item.ttl && item.ttl < now) {
        this.cache.delete(key);
      }
    });
  }
}

/**
 * Mock cache manager compatible with NestJS CacheModule
 */
@Injectable()
export class CacheManager {
  private store: MemoryStore;

  constructor() {
    this.store = new MemoryStore();
  }

  /**
   * Get a cached value by key
   */
  get(key: string): Promise<any> {
    return this.store.get(key);
  }

  /**
   * Set a value in the cache with optional TTL
   */
  set(key: string, value: any, ttl?: number): Promise<void> {
    return this.store.set(key, value, ttl);
  }

  /**
   * Delete a cache entry by key
   */
  del(key: string): Promise<void> {
    return this.store.del(key);
  }

  /**
   * Clear all cache entries
   */
  reset(): Promise<void> {
    return this.store.reset();
  }
}

/**
 * Provide a CACHE_MANAGER token for dependency injection
 */
export const CACHE_MANAGER_PROVIDER = {
  provide: 'CACHE_MANAGER',
  useFactory: () => {
    return new CacheManager();
  }
}; 