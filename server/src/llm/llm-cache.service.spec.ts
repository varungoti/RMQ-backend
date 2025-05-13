import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LlmCacheService } from './llm-cache.service';
import { LlmResponse } from '../dto/llm-provider.dto';

// Mock ConfigService
const mockConfigService = {
  get: jest.fn(),
};

// Helper to create service instance with specific config
const createService = (config: Record<string, any>): LlmCacheService => {
  const mockConfigGet = jest.fn((key: string) => config[key]);
  const configService = { get: mockConfigGet } as any;
  return new LlmCacheService(configService);
};

describe('LlmCacheService', () => {
  let service: LlmCacheService;

  // Mock Date.now() for TTL tests
  const realDateNow = Date.now.bind(global.Date);
  const mockTimestamp = 1700000000000;
  beforeAll(() => {
    global.Date.now = jest.fn(() => mockTimestamp);
  });
  afterAll(() => {
    global.Date.now = realDateNow;
  });

  beforeEach(() => {
    // Default config for most tests: enabled, 1hr TTL, size 10
    service = createService({ 
      LLM_CACHE_ENABLED: true, 
      LLM_CACHE_TTL_SECONDS: 3600, 
      LLM_CACHE_MAX_SIZE: 10 
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Cache Get/Set', () => {
    const prompt = 'Test prompt';
    const systemPrompt = 'System';
    const provider = 'openai';
    const model = 'gpt-test';
    const response: LlmResponse = { content: 'Cached data', isError: false };
    
    // @ts-ignore - Access private method for testing key generation
    const cacheKey = service.generateCacheKey(prompt, systemPrompt, provider, model);

    it('should set and get a value within TTL', () => {
      service.set(prompt, systemPrompt, provider, model, response);
      const result = service.get(prompt, systemPrompt, provider, model);
      expect(result).toEqual(response);
      const stats = service.getStats();
      expect(stats.metrics.hits).toBe(1);
      expect(stats.metrics.misses).toBe(0);
      expect(stats.metrics.totalRequests).toBe(1);
    });

    it('should return null for expired entry', () => {
      service.set(prompt, systemPrompt, provider, model, response);
      // Advance time beyond TTL (3600s = 3,600,000 ms)
      global.Date.now = jest.fn(() => mockTimestamp + 3600001); 
      const result = service.get(prompt, systemPrompt, provider, model);
      expect(result).toBeNull();
      const stats = service.getStats();
      expect(stats.metrics.misses).toBe(1);
      expect(stats.metrics.expirations).toBe(1);
    });

    it('should return null if cache is disabled', () => {
      const disabledService = createService({ LLM_CACHE_ENABLED: false });
      disabledService.set(prompt, systemPrompt, provider, model, response);
      const result = disabledService.get(prompt, systemPrompt, provider, model);
      expect(result).toBeNull();
      const stats = disabledService.getStats();
      expect(stats.enabled).toBe(false);
    });

    it('should not cache error responses', () => {
      const errorResponse: LlmResponse = { content: '', isError: true, errorMessage: 'API Error' };
      service.set(prompt, systemPrompt, provider, model, errorResponse);
      const result = service.get(prompt, systemPrompt, provider, model);
      expect(result).toBeNull();
      const stats = service.getStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('Cache Eviction', () => {
    it('should evict the oldest entry when max size is reached', () => {
      const smallCacheService = createService({ LLM_CACHE_ENABLED: true, LLM_CACHE_MAX_SIZE: 2, LLM_CACHE_TTL_SECONDS: 3600 });
      const res1: LlmResponse = { content: '1', isError: false };
      const res2: LlmResponse = { content: '2', isError: false };
      const res3: LlmResponse = { content: '3', isError: false };

      // Set 1 (Timestamp: mockTimestamp)
      smallCacheService.set('p1', 's1', 'prov', 'mod', res1);
      // Set 2 (Timestamp: mockTimestamp + 1000)
      global.Date.now = jest.fn(() => mockTimestamp + 1000);
      smallCacheService.set('p2', 's2', 'prov', 'mod', res2);
      // Set 3 (Timestamp: mockTimestamp + 2000) - should evict p1
      global.Date.now = jest.fn(() => mockTimestamp + 2000);
      smallCacheService.set('p3', 's3', 'prov', 'mod', res3);

      const stats = smallCacheService.getStats();
      expect(stats.size).toBe(2);
      expect(stats.metrics.evictions).toBe(1);

      // Verify p1 is gone, p2 and p3 remain
      expect(smallCacheService.get('p1', 's1', 'prov', 'mod')).toBeNull();
      expect(smallCacheService.get('p2', 's2', 'prov', 'mod')).toEqual(res2);
      expect(smallCacheService.get('p3', 's3', 'prov', 'mod')).toEqual(res3);
    });
  });

  describe('Cache Management', () => {
    it('should clear the cache', () => {
      service.set('p1', 's1', 'prov', 'mod', { content: 'data', isError: false });
      expect(service.getStats().size).toBe(1);
      service.clearCache();
      expect(service.getStats().size).toBe(0);
      expect(service.get('p1', 's1', 'prov', 'mod')).toBeNull();
    });

    it('should clear provider-specific cache entries', () => {
      service.set('p', 's', 'openai', 'm1', { content: 'o1', isError: false });
      service.set('p', 's', 'openai', 'm2', { content: 'o2', isError: false });
      service.set('p', 's', 'gemini', 'm1', { content: 'g1', isError: false });
      expect(service.getStats().size).toBe(3);

      service.clearProviderCache('openai');

      expect(service.getStats().size).toBe(1);
      expect(service.get('p', 's', 'openai', 'm1')).toBeNull();
      expect(service.get('p', 's', 'openai', 'm2')).toBeNull();
      expect(service.get('p', 's', 'gemini', 'm1')).toEqual({ content: 'g1', isError: false });
    });

    it('should reset metrics', () => {
      service.set('p', 's', 'prov', 'mod', { content: 'd', isError: false });
      service.get('p', 's', 'prov', 'mod'); // Hit
      service.get('p2', 's', 'prov', 'mod'); // Miss
      
      let stats = service.getStats();
      expect(stats.metrics.hits).toBe(1);
      expect(stats.metrics.misses).toBe(1);
      expect(stats.metrics.totalRequests).toBe(2);

      service.resetMetrics();
      stats = service.getStats();
      expect(stats.metrics.hits).toBe(0);
      expect(stats.metrics.misses).toBe(0);
      expect(stats.metrics.totalRequests).toBe(0);
      expect(stats.metrics.hitRatio).toBe(0);
    });

    it('should return correct stats', () => {
      const stats = service.getStats();
      expect(stats.enabled).toBe(true);
      expect(stats.maxSize).toBe(10);
      expect(stats.ttlSeconds).toBe(3600);
      expect(stats.size).toBe(0);
      expect(stats.metrics).toBeDefined();
    });
  });

  // Note: Tests for private methods like normalizePrompt, generateCacheKey, cleanupExpiredEntries are omitted
  // as they are implementation details tested via the public methods (get, set, eviction).
}); 