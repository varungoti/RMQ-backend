import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { LlmRedisCacheService } from './llm-redis-cache.service';
import { LlmCacheService } from './llm-cache.service'; // In-memory fallback
import { LlmResponse } from 'src/dto/llm-provider.dto';

// Mock the Cache (cache-manager) interface
const mockCacheManager: jest.Mocked<Cache> = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  reset: jest.fn(),
  wrap: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
  store: {
    keys: jest.fn(),
    ttl: jest.fn(),
    // Add other store methods if needed
  } as any,
};

// Mock the LlmCacheService (in-memory fallback)
const mockInMemoryCache: jest.Mocked<LlmCacheService> = {
  get: jest.fn(),
  set: jest.fn(),
  getStats: jest.fn(),
  clearCache: jest.fn(),
  resetMetrics: jest.fn(),
  clearProviderCache: jest.fn(),
} as any;

// Helper to create service instance
const createService = (config: Record<string, any>): LlmRedisCacheService => {
  const mockConfigGet = jest.fn((key: string) => config[key]);
  const configService = { get: mockConfigGet } as any;
  
  // Reset mocks for each creation
  Object.values(mockCacheManager).forEach(mockFn => typeof mockFn === 'function' && mockFn.mockClear());
  Object.values(mockInMemoryCache).forEach(mockFn => typeof mockFn === 'function' && mockFn.mockClear());

  return new LlmRedisCacheService(configService, mockCacheManager, mockInMemoryCache);
};

describe('LlmRedisCacheService', () => {
  let service: LlmRedisCacheService;

  beforeEach(() => {
    // Default config: Redis enabled, fallback enabled
    service = createService({ 
      REDIS_CACHE_ENABLED: true, 
      LLM_CACHE_ENABLED: true, // For fallback
      REDIS_CACHE_TTL_SECONDS: 3600,
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Get/Set Operations', () => {
    const prompt = 'Redis prompt';
    const systemPrompt = 'Redis system';
    const provider = 'gemini';
    const model = 'gemini-test';
    const response: LlmResponse = { content: 'Redis data', isError: false };
    // @ts-ignore - Access private method for testing key generation
    const cacheKey = service.generateCacheKey(prompt, systemPrompt, provider, model);

    it('should get value from Redis cache if enabled and available', async () => {
      mockCacheManager.get.mockResolvedValue(response);
      const result = await service.get(prompt, systemPrompt, provider, model);
      expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(mockInMemoryCache.get).not.toHaveBeenCalled();
      expect(result).toEqual(response);
      // Check metrics update (basic check)
      const stats = await service.getStats();
      expect(stats.metrics.hits).toBe(1);
      expect(stats.metrics.misses).toBe(0);
    });

    it('should return null if Redis miss and fallback disabled', async () => {
       service = createService({ REDIS_CACHE_ENABLED: true, LLM_CACHE_ENABLED: false }); // Disable fallback
       mockCacheManager.get.mockResolvedValue(null); // Redis miss
       const result = await service.get(prompt, systemPrompt, provider, model);
       expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
       expect(mockInMemoryCache.get).not.toHaveBeenCalled();
       expect(result).toBeNull();
       const stats = await service.getStats();
       expect(stats.metrics.misses).toBe(1);
    });

    it('should get value from in-memory cache if Redis disabled but fallback enabled', async () => {
      service = createService({ REDIS_CACHE_ENABLED: false, LLM_CACHE_ENABLED: true }); // Disable Redis, enable fallback
      mockInMemoryCache.get.mockReturnValue(response); // Hit in fallback
      const result = await service.get(prompt, systemPrompt, provider, model);
      expect(mockCacheManager.get).not.toHaveBeenCalled();
      expect(mockInMemoryCache.get).toHaveBeenCalledWith(prompt, systemPrompt, provider, model);
      expect(result).toEqual(response);
    });
    
    it('should get value from in-memory cache if Redis errors and fallback enabled', async () => {
       mockCacheManager.get.mockRejectedValue(new Error('Redis down')); // Simulate Redis error
       mockInMemoryCache.get.mockReturnValue(response); // Hit in fallback
       const result = await service.get(prompt, systemPrompt, provider, model);
       expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
       expect(mockInMemoryCache.get).toHaveBeenCalledWith(prompt, systemPrompt, provider, model);
       expect(result).toEqual(response);
    });

    it('should set value in Redis cache if enabled', async () => {
      await service.set(prompt, systemPrompt, provider, model, response);
      expect(mockCacheManager.set).toHaveBeenCalledWith(cacheKey, response, 3600 * 1000);
      expect(mockInMemoryCache.set).not.toHaveBeenCalled();
    });

    it('should set value in in-memory cache if Redis disabled but fallback enabled', async () => {
      service = createService({ REDIS_CACHE_ENABLED: false, LLM_CACHE_ENABLED: true });
      await service.set(prompt, systemPrompt, provider, model, response);
      expect(mockCacheManager.set).not.toHaveBeenCalled();
      expect(mockInMemoryCache.set).toHaveBeenCalledWith(prompt, systemPrompt, provider, model, response);
    });
    
    it('should set value in in-memory cache if Redis errors and fallback enabled', async () => {
       mockCacheManager.set.mockRejectedValue(new Error('Redis down')); // Simulate Redis error
       await service.set(prompt, systemPrompt, provider, model, response);
       expect(mockCacheManager.set).toHaveBeenCalledWith(cacheKey, response, 3600 * 1000);
       expect(mockInMemoryCache.set).toHaveBeenCalledWith(prompt, systemPrompt, provider, model, response);
    });
    
    it('should not set error responses in Redis', async () => {
        const errorResponse: LlmResponse = { content: '', isError: true };
        await service.set(prompt, systemPrompt, provider, model, errorResponse);
        expect(mockCacheManager.set).not.toHaveBeenCalled();
        expect(mockInMemoryCache.set).not.toHaveBeenCalled(); // Should also not set in fallback
    });

    it('should not set/get if both caches disabled', async () => {
        service = createService({ REDIS_CACHE_ENABLED: false, LLM_CACHE_ENABLED: false });
        
        await service.set(prompt, systemPrompt, provider, model, response);
        expect(mockCacheManager.set).not.toHaveBeenCalled();
        expect(mockInMemoryCache.set).not.toHaveBeenCalled();

        const result = await service.get(prompt, systemPrompt, provider, model);
        expect(mockCacheManager.get).not.toHaveBeenCalled();
        expect(mockInMemoryCache.get).not.toHaveBeenCalled();
        expect(result).toBeNull();
    });
  });

  describe('Cache Management', () => {
    it('should clear Redis cache if enabled', async () => {
      await service.clearCache();
      expect(mockCacheManager.reset).toHaveBeenCalled();
      expect(mockInMemoryCache.clearCache).toHaveBeenCalled(); // Always clears fallback
      expect(mockInMemoryCache.resetMetrics).toHaveBeenCalled(); // And resets metrics
    });

    it('should clear only in-memory cache if Redis disabled but fallback enabled', async () => {
      service = createService({ REDIS_CACHE_ENABLED: false, LLM_CACHE_ENABLED: true });
      await service.clearCache();
      expect(mockCacheManager.reset).not.toHaveBeenCalled();
      expect(mockInMemoryCache.clearCache).toHaveBeenCalled();
      expect(mockInMemoryCache.resetMetrics).toHaveBeenCalled();
    });

    it('should reset metrics', async () => {
       // Need to call get/set first to populate metrics
       mockCacheManager.get.mockResolvedValue(null);
       await service.get('p', 's', 'prov', 'mod'); // Miss
       let stats = await service.getStats();
       expect(stats.metrics.misses).toBe(1);
       
       service.resetMetrics();
       stats = await service.getStats();
       expect(stats.metrics.misses).toBe(0); // Check if reset worked
    });

    it('should clear provider-specific cache in Redis', async () => {
       const providerType = 'openai';
       await service.clearProviderCache(providerType);
       expect(mockCacheManager.store.keys).toHaveBeenCalledWith(`${providerType}:*`); // Assuming keys are prefixed
       // Need to mock keys response and subsequent del calls for full test
    });
    
     it('should fallback to clearing provider cache in memory if Redis disabled', async () => {
       service = createService({ REDIS_CACHE_ENABLED: false, LLM_CACHE_ENABLED: true });
       const providerType = 'openai';
       await service.clearProviderCache(providerType);
       expect(mockCacheManager.store.keys).not.toHaveBeenCalled();
       expect(mockInMemoryCache.clearProviderCache).toHaveBeenCalledWith(providerType);
    });
    
     it('should handle error during Redis clearProviderCache gracefully', async () => {
       const providerType = 'openai';
       // Explicitly cast to jest.Mock to access mockRejectedValue
       (mockCacheManager.store.keys as jest.Mock).mockRejectedValue(new Error('Redis keys error'));
       // Expect no error thrown, maybe logs an error
       await expect(service.clearProviderCache(providerType)).resolves.toBeUndefined();
       // Should still attempt to clear in-memory cache
       expect(mockInMemoryCache.clearProviderCache).toHaveBeenCalledWith(providerType);
    });

  });

  // Tests for getStats might need more refinement based on connection check logic
}); 