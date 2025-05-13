import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAiProviderService } from './openai-provider.service';
import { GeminiProviderService } from './gemini-provider.service';
import { AnthropicProviderService } from './anthropic-provider.service';
import { CohereProviderService } from './cohere-provider.service';
import { LlmCacheService } from './llm-cache.service';
import { LlmRedisCacheService } from './llm-redis-cache.service';
import { LlmProviderConfig, LlmProviderType } from 'src/dto/llm-provider.dto';
import { ILlmCacheService } from './llm-provider.service';
import { LlmProviderService } from './llm-provider.service';

@Injectable()
export class LlmFactoryService {
  private readonly logger = new Logger(LlmFactoryService.name);
  private providers: Map<LlmProviderType, LlmProviderService> = new Map();
  private defaultProvider: LlmProviderType = LlmProviderType.GEMINI; // Default is Gemini

  constructor(
    private configService: ConfigService,
    private cacheService: LlmCacheService,
    private redisCacheService?: LlmRedisCacheService,
  ) {
    this.initializeProviders();
  }

  /**
   * Initialize all LLM providers from environment configuration
   */
  private initializeProviders(): void {
    // Check if Redis cache is available and enabled
    const redisEnabled = this.configService.get<boolean>('REDIS_CACHE_ENABLED') || false;
    const cacheToUse: ILlmCacheService = redisEnabled && this.redisCacheService ? this.redisCacheService : this.cacheService;
    
    this.logger.log(`Using ${redisEnabled ? 'Redis' : 'in-memory'} cache for LLM responses`);

    // Initialize OpenAI provider
    const openAiConfig: LlmProviderConfig = {
      type: LlmProviderType.OPENAI,
      apiKey: this.configService.get<string>('OPENAI_API_KEY') || '',
      model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo',
      temperature: this.configService.get<number>('OPENAI_TEMPERATURE') || 0.7,
      enabled: !!this.configService.get<boolean>('USE_OPENAI'),
    };
    const openAiProvider = new OpenAiProviderService(openAiConfig);
    openAiProvider.setCacheService(cacheToUse);
    this.providers.set(LlmProviderType.OPENAI, openAiProvider);

    // Initialize Gemini provider
    const geminiConfig: LlmProviderConfig = {
      type: LlmProviderType.GEMINI,
      apiKey: this.configService.get<string>('GEMINI_API_KEY') || '',
      model: this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.5-pro',
      temperature: this.configService.get<number>('GEMINI_TEMPERATURE') || 0.7,
      enabled: this.configService.get<boolean>('USE_GEMINI') !== false, // Default to true
    };
    const geminiProvider = new GeminiProviderService(geminiConfig);
    geminiProvider.setCacheService(cacheToUse);
    this.providers.set(LlmProviderType.GEMINI, geminiProvider);

    // Initialize Anthropic provider
    const anthropicConfig: LlmProviderConfig = {
      type: LlmProviderType.ANTHROPIC,
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY') || '',
      model: this.configService.get<string>('ANTHROPIC_MODEL') || 'claude-3-haiku-20240307',
      temperature: this.configService.get<number>('ANTHROPIC_TEMPERATURE') || 0.7,
      enabled: !!this.configService.get<boolean>('USE_ANTHROPIC'),
    };
    const anthropicProvider = new AnthropicProviderService(anthropicConfig);
    anthropicProvider.setCacheService(cacheToUse);
    this.providers.set(LlmProviderType.ANTHROPIC, anthropicProvider);

    // Initialize Cohere provider
    const cohereConfig: LlmProviderConfig = {
      type: LlmProviderType.COHERE,
      apiKey: this.configService.get<string>('COHERE_API_KEY') || '',
      model: this.configService.get<string>('COHERE_MODEL') || 'command',
      temperature: this.configService.get<number>('COHERE_TEMPERATURE') || 0.7,
      enabled: !!this.configService.get<boolean>('USE_COHERE'),
    };
    const cohereProvider = new CohereProviderService(cohereConfig);
    cohereProvider.setCacheService(cacheToUse);
    this.providers.set(LlmProviderType.COHERE, cohereProvider);

    // Set default provider based on configuration (Gemini is default)
    const configuredDefault = this.configService.get<string>('DEFAULT_LLM_PROVIDER');
    if (configuredDefault) {
      const providerType = configuredDefault.toLowerCase() as LlmProviderType;
      if (Object.values(LlmProviderType).includes(providerType)) {
        this.defaultProvider = providerType;
      }
    }

    // Log the initialization
    this.logger.log(`Initialized LLM providers with default: ${this.defaultProvider}`);
    for (const [type, provider] of this.providers.entries()) {
      this.logger.log(`Provider ${type}: enabled=${provider.isEnabled()}, model=${provider.getConfig().model}`);
    }
  }

  /**
   * Get a specific LLM provider service by type
   */
  getProvider(type: LlmProviderType): LlmProviderService | null {
    return this.providers.get(type) || null;
  }

  /**
   * Get the default LLM provider service
   */
  getDefaultProvider(): LlmProviderService {
    // Try to get the configured default provider
    const provider = this.providers.get(this.defaultProvider);
    if (provider && provider.isEnabled()) {
      return provider;
    }

    // If default is not enabled, find the first enabled provider
    for (const [type, providerService] of this.providers.entries()) {
      if (providerService.isEnabled()) {
        this.logger.warn(`Default provider ${this.defaultProvider} not enabled, using ${type} instead`);
        return providerService;
      }
    }

    // If no providers are enabled, use the default anyway (will return error on usage)
    this.logger.warn('No enabled LLM providers found, using disabled default provider');
    return this.providers.get(this.defaultProvider)!;
  }

  /**
   * Get all available LLM providers
   */
  getAllProviders(): Map<LlmProviderType, LlmProviderService> {
    return this.providers;
  }

  /**
   * Check if any LLM provider is enabled
   */
  isAnyProviderEnabled(): boolean {
    for (const provider of this.providers.values()) {
      if (provider.isEnabled()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Set the default LLM provider service
   */
  setDefaultProvider(type: LlmProviderType): boolean {
    if (!this.providers.has(type)) {
      this.logger.error(`Cannot set default provider to ${type}: provider not found`);
      return false;
    }
    
    const provider = this.providers.get(type)!;
    if (!provider.isEnabled()) {
      this.logger.warn(`Setting default provider to ${type} but it is not enabled`);
    }
    
    this.logger.log(`Setting default provider from ${this.defaultProvider} to ${type}`);
    this.defaultProvider = type;
    return true;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ enabled: boolean; size: number; maxSize: number; ttlSeconds: number; metrics: any }> {
    // If Redis cache is enabled, use it for stats
    if (this.configService.get<boolean>('REDIS_CACHE_ENABLED') && this.redisCacheService) {
      const redisStats = await this.redisCacheService.getStats();
      // Transform Redis stats to match the expected return type
      return {
        enabled: redisStats.enabled,
        size: 0, // Redis doesn't easily expose size, would need additional code to count
        maxSize: 0, // Redis doesn't easily expose max size in the same way
        ttlSeconds: redisStats.ttlSeconds,
        metrics: redisStats.metrics
      };
    }
    
    // Fallback to in-memory cache stats
    return this.cacheService.getStats();
  }

  /**
   * Clear the cache
   */
  async clearCache(): Promise<void> {
    // If Redis cache is enabled, clear it
    if (this.configService.get<boolean>('REDIS_CACHE_ENABLED') && this.redisCacheService) {
      await this.redisCacheService.clearCache();
      return;
    }
    
    // Fallback to clearing in-memory cache
    this.cacheService.clearCache();
  }

  /**
   * Reset cache metrics
   */
  async resetCacheMetrics(): Promise<void> {
    // If Redis cache is enabled, reset its metrics
    if (this.configService.get<boolean>('REDIS_CACHE_ENABLED') && this.redisCacheService) {
      this.redisCacheService.resetMetrics();
    }
    
    // Always reset in-memory cache metrics as well
    this.cacheService.resetMetrics();
    this.logger.log('Cache metrics reset via factory service');
  }

  /**
   * Update a provider's configuration
   */
  updateProviderConfig(type: LlmProviderType, config: Partial<LlmProviderConfig>): boolean {
    const provider = this.getProvider(type);
    if (!provider) {
      this.logger.warn(`Provider ${type} not found, cannot update config`);
      return false;
    }
    
    const oldModel = provider.getConfig().model;
    const newModel = config.model;
    
    // Update provider configuration
    provider.updateConfig(config);
    
    // If model has changed, invalidate cache for this provider
    if (newModel && oldModel !== newModel) {
      this.logger.log(`Model changed from ${oldModel} to ${newModel}, invalidating cache for provider ${type}`);
      this.invalidateProviderCache(type);
    }
    
    return true;
  }
  
  /**
   * Invalidate cache for a specific provider
   */
  async invalidateProviderCache(type: LlmProviderType): Promise<void> {
    this.logger.log(`Invalidating cache for provider ${type}`);
    
    // If Redis cache is enabled, clear provider-specific entries
    if (this.configService.get<boolean>('REDIS_CACHE_ENABLED') && this.redisCacheService) {
      await this.redisCacheService.clearProviderCache(type);
    }
    
    // Also clear in-memory cache for the provider
    this.cacheService.clearProviderCache(type);
  }
} 