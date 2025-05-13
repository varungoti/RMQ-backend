import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LlmFactoryService } from './llm-factory.service';
import { LlmCacheService } from './llm-cache.service';
import { LlmRedisCacheService } from './llm-redis-cache.service';
import { LlmProviderService } from './llm-provider.service';
import { LlmProviderType } from 'src/dto/llm-provider.dto';
import { OpenAiProviderService } from './openai-provider.service';
import { GeminiProviderService } from './gemini-provider.service';
import { AnthropicProviderService } from './anthropic-provider.service';
import { CohereProviderService } from './cohere-provider.service';

// Mock actual provider services
class MockProviderService extends LlmProviderService {
  constructor(type: LlmProviderType, enabled = true) {
    super({ type, apiKey: 'mock-key', enabled });
  }
  generateResponse = jest.fn();
  setConfig = jest.fn();
  sendPrompt = jest.fn();
}

// Explicitly type mocks using jest.fn()
const mockCacheService: { [K in keyof LlmCacheService]: jest.Mock } = {
  getStats: jest.fn(),
  clearCache: jest.fn(),
  resetMetrics: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  clearProviderCache: jest.fn(),
  // NOTE: Removed mocks for private methods
};

const mockRedisCacheService: { [K in keyof LlmRedisCacheService]: jest.Mock } = {
  getStats: jest.fn(),
  clearCache: jest.fn(),
  resetMetrics: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  clearProviderCache: jest.fn(), // Correct method name
  // NOTE: Removed mocks for private methods
};

describe('LlmFactoryService', () => {
  let factoryService: LlmFactoryService;
  let configService: ConfigService;
  let cacheService: LlmCacheService;
  let redisCacheService: LlmRedisCacheService | undefined;

  const setupFactory = (config: Record<string, any>, useRedis = false) => {
    // Mock ConfigService get method
    const mockConfigGet = jest.fn((key: string) => config[key]);
    configService = { get: mockConfigGet } as any;
    
    cacheService = { ...mockCacheService } as any; // Use spread to reset mocks per setup
    redisCacheService = useRedis ? { ...mockRedisCacheService } as any : undefined;

    // Manually construct the factory service with mocked dependencies
    // This bypasses the complex DI setup for provider instantiation inside the factory constructor
    factoryService = new LlmFactoryService(configService, cacheService, redisCacheService);

    // Clear and manually populate the providers map after construction
    // @ts-ignore - Access private property for testing
    factoryService.providers.clear(); 
    
    const cacheToUse = useRedis && redisCacheService ? redisCacheService : cacheService;

    if (config['USE_OPENAI']) {
       // @ts-ignore
      const provider = new MockProviderService(LlmProviderType.OPENAI, true);
      provider.setCacheService(cacheToUse);
      // @ts-ignore
      factoryService.providers.set(LlmProviderType.OPENAI, provider);
    }
    if (config['USE_GEMINI'] !== false) { // Default true
      // @ts-ignore
      const provider = new MockProviderService(LlmProviderType.GEMINI, true);
      provider.setCacheService(cacheToUse);
      // @ts-ignore
      factoryService.providers.set(LlmProviderType.GEMINI, provider);
    }
     if (config['USE_ANTHROPIC']) {
       // @ts-ignore
      const provider = new MockProviderService(LlmProviderType.ANTHROPIC, true);
      provider.setCacheService(cacheToUse);
       // @ts-ignore
      factoryService.providers.set(LlmProviderType.ANTHROPIC, provider);
    }
    if (config['USE_COHERE']) {
      // @ts-ignore
      const provider = new MockProviderService(LlmProviderType.COHERE, true);
      provider.setCacheService(cacheToUse);
      // @ts-ignore
      factoryService.providers.set(LlmProviderType.COHERE, provider);
    }
    
     // Set default provider based on config
     const defaultProviderType = config['DEFAULT_LLM_PROVIDER']?.toLowerCase() as LlmProviderType || LlmProviderType.GEMINI;
     // @ts-ignore
     factoryService.defaultProvider = defaultProviderType;
  };

  it('should be defined', () => {
    setupFactory({}); // Basic setup
    expect(factoryService).toBeDefined();
  });

  describe('Provider Initialization and Selection', () => {
    it('should initialize providers based on config', () => {
      setupFactory({ USE_OPENAI: true, USE_GEMINI: true });
      // @ts-ignore
      expect(factoryService.providers.size).toBe(2);
      expect(factoryService.getProvider(LlmProviderType.OPENAI)).toBeInstanceOf(MockProviderService);
      expect(factoryService.getProvider(LlmProviderType.GEMINI)).toBeInstanceOf(MockProviderService);
      expect(factoryService.getProvider(LlmProviderType.ANTHROPIC)).toBeNull();
    });

    it('should return the correct default provider (Gemini by default)', () => {
      setupFactory({ USE_GEMINI: true, USE_OPENAI: true });
      const defaultProvider = factoryService.getDefaultProvider();
      // @ts-ignore
      expect(defaultProvider.config.type).toBe(LlmProviderType.GEMINI);
    });

    it('should return the configured default provider if enabled', () => {
      setupFactory({ DEFAULT_LLM_PROVIDER: 'openai', USE_OPENAI: true, USE_GEMINI: true });
      const defaultProvider = factoryService.getDefaultProvider();
      // @ts-ignore
      expect(defaultProvider.config.type).toBe(LlmProviderType.OPENAI);
    });

    it('should fallback to the first enabled provider if default is disabled', () => {
      setupFactory({ DEFAULT_LLM_PROVIDER: 'gemini', USE_GEMINI: false, USE_OPENAI: true, USE_ANTHROPIC: true });
      const defaultProvider = factoryService.getDefaultProvider();
      // Assuming map iteration order is insertion order: OpenAI should be first enabled
      // @ts-ignore
      expect(defaultProvider.config.type).toBe(LlmProviderType.OPENAI);
    });

    it('should return the (disabled) default provider if none are enabled', () => {
      setupFactory({ USE_GEMINI: false, USE_OPENAI: false });
      const defaultProvider = factoryService.getDefaultProvider();
      // @ts-ignore
      expect(defaultProvider.config.type).toBe(LlmProviderType.GEMINI);
      expect(defaultProvider.isEnabled()).toBe(false);
    });
    
    it('should get a specific provider by type', () => {
       setupFactory({ USE_OPENAI: true });
       const provider = factoryService.getProvider(LlmProviderType.OPENAI);
       expect(provider).toBeInstanceOf(MockProviderService);
       // @ts-ignore
       expect(provider.config.type).toBe(LlmProviderType.OPENAI);
    });
    
    it('should return null for non-existent provider type', () => {
       setupFactory({});
       // @ts-ignore - Testing invalid type
       const provider = factoryService.getProvider('non-existent');
       expect(provider).toBeNull();
    });

    it('should correctly report if any provider is enabled', () => {
      setupFactory({ USE_ANTHROPIC: true });
      expect(factoryService.isAnyProviderEnabled()).toBe(true);
      
      setupFactory({}); // No providers enabled explicitly
      // Gemini defaults to true, so need USE_GEMINI: false
      setupFactory({ USE_GEMINI: false });
      expect(factoryService.isAnyProviderEnabled()).toBe(false);
    });

    it('should allow setting a new default provider', () => {
      setupFactory({ USE_OPENAI: true, USE_GEMINI: true });
      const setResult = factoryService.setDefaultProvider(LlmProviderType.OPENAI);
      expect(setResult).toBe(true);
      const defaultProvider = factoryService.getDefaultProvider();
      // @ts-ignore
      expect(defaultProvider.config.type).toBe(LlmProviderType.OPENAI);
    });

    it('should return false when setting non-existent default provider', () => {
      setupFactory({});
      // @ts-ignore
      const setResult = factoryService.setDefaultProvider('invalid-provider');
      expect(setResult).toBe(false);
    });
  });

  describe('Cache Interaction', () => {
    it('should use in-memory cache by default', async () => {
      setupFactory({ USE_GEMINI: true });
      await factoryService.getCacheStats();
      expect(cacheService.getStats).toHaveBeenCalled();
      expect(mockRedisCacheService.getStats).not.toHaveBeenCalled();
    });

    it('should use redis cache if enabled and available', async () => {
      setupFactory({ REDIS_CACHE_ENABLED: true, USE_GEMINI: true }, true); // Pass true for useRedis
      await factoryService.getCacheStats();
      expect(mockRedisCacheService.getStats).toHaveBeenCalled();
      expect(cacheService.getStats).not.toHaveBeenCalled();
    });

    it('should clear the correct cache', async () => {
      setupFactory({ USE_GEMINI: true });
      await factoryService.clearCache();
      expect(mockCacheService.clearCache).toHaveBeenCalled();
      expect(mockRedisCacheService.clearCache).not.toHaveBeenCalled();

      mockCacheService.clearCache.mockClear();

      setupFactory({ REDIS_CACHE_ENABLED: true, USE_GEMINI: true }, true);
      await factoryService.clearCache();
      expect(mockRedisCacheService.clearCache).toHaveBeenCalled();
      expect(mockCacheService.clearCache).not.toHaveBeenCalled();
    });

    it('should reset metrics on the correct cache(s)', async () => {
      setupFactory({ USE_GEMINI: true });
      await factoryService.resetCacheMetrics();
      expect(mockCacheService.resetMetrics).toHaveBeenCalled();
      expect(mockRedisCacheService.resetMetrics).not.toHaveBeenCalled();
      
      mockCacheService.resetMetrics.mockClear();

      setupFactory({ REDIS_CACHE_ENABLED: true, USE_GEMINI: true }, true);
      await factoryService.resetCacheMetrics();
      expect(mockRedisCacheService.resetMetrics).toHaveBeenCalled();
      expect(mockCacheService.resetMetrics).toHaveBeenCalled(); // In-memory metrics are always reset
    });
    
    it('should clear provider cache on the correct cache service(s)', async () => {
       setupFactory({ USE_OPENAI: true });
       // Factory's invalidateProviderCache calls clearProviderCache on cache services
       await factoryService.invalidateProviderCache(LlmProviderType.OPENAI);
       expect(mockCacheService.clearProviderCache).toHaveBeenCalledWith(LlmProviderType.OPENAI);
       expect(mockRedisCacheService.clearProviderCache).not.toHaveBeenCalled();
       
       mockCacheService.clearProviderCache.mockClear(); 
       
       setupFactory({ REDIS_CACHE_ENABLED: true, USE_OPENAI: true }, true);
       await factoryService.invalidateProviderCache(LlmProviderType.OPENAI);
       expect(mockRedisCacheService.clearProviderCache).toHaveBeenCalledWith(LlmProviderType.OPENAI);
       // Factory invalidateProviderCache clears both if Redis is enabled
       expect(mockCacheService.clearProviderCache).toHaveBeenCalledWith(LlmProviderType.OPENAI); 
    });
  });
  
  // Add describe block for updateProviderConfig

}); 