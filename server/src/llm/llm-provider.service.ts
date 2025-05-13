import { Logger } from '@nestjs/common';
import { LlmProviderConfig, LlmResponse } from 'src/dto/llm-provider.dto';

// Define an interface for cache services
export interface ILlmCacheService {
  get(prompt: string, systemPrompt: string | undefined, provider: string, model: string): Promise<LlmResponse | null> | LlmResponse | null;
  set(prompt: string, systemPrompt: string | undefined, provider: string, model: string, response: LlmResponse): Promise<void> | void;
}

/**
 * Abstract class for LLM provider services
 * All specific provider implementations should extend this
 */
export abstract class LlmProviderService {
  protected readonly logger: Logger;
  protected config: LlmProviderConfig;
  protected cacheService?: ILlmCacheService;

  constructor(config: LlmProviderConfig) {
    this.config = config;
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Set the cache service - will be called by factory after initialization
   */
  setCacheService(cacheService: ILlmCacheService): void {
    this.cacheService = cacheService;
  }

  /**
   * Get the provider configuration
   */
  getConfig(): LlmProviderConfig {
    return this.config;
  }

  /**
   * Check if the provider is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled && this.config.apiKey && this.config.apiKey.length > 0;
  }

  /**
   * Update the provider configuration
   */
  updateConfig(config: Partial<LlmProviderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Send a prompt to the LLM provider with caching
   * If the response is in the cache, it will be returned immediately
   * Otherwise, the prompt will be sent to the provider and the response will be cached
   */
  async sendPromptWithCache(prompt: string, systemPrompt?: string): Promise<LlmResponse> {
    if (!this.cacheService) {
      return this.sendPrompt(prompt, systemPrompt);
    }

    const cachedResponse = await Promise.resolve(this.cacheService.get(prompt, systemPrompt, this.config.type, this.config.model || ''));
    if (cachedResponse) {
      this.logger.log(`Using cached response for provider ${this.config.type} and model ${this.config.model}`);
      return cachedResponse;
    }

    const response = await this.sendPrompt(prompt, systemPrompt);
    
    if (!response.isError) {
      await Promise.resolve(this.cacheService.set(prompt, systemPrompt, this.config.type, this.config.model || '', response));
    }
    
    return response;
  }

  /**
   * Send a prompt to the LLM provider and get a response
   * @param prompt The prompt to send
   * @param systemPrompt Optional system prompt for models that support it
   * @returns Promise with the response content or error
   */
  abstract sendPrompt(prompt: string, systemPrompt?: string): Promise<LlmResponse>;
} 