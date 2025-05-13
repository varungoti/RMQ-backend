import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { LlmProviderConfig, LlmProviderType, LlmResponse } from 'src/dto/llm-provider.dto';
import { LlmCacheService } from './llm-cache.service'; 
import { AnthropicProviderService } from './anthropic-provider.service';

// Mock axios post method
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock Cache Service
const mockCacheService: jest.Mocked<LlmCacheService> = {
  get: jest.fn(),
  set: jest.fn(),
  getStats: jest.fn(),
  clearCache: jest.fn(),
  resetMetrics: jest.fn(),
  clearProviderCache: jest.fn(),
} as any;

describe('AnthropicProviderService', () => {
  let service: AnthropicProviderService;
  let config: LlmProviderConfig;

  beforeEach(() => {
    config = {
      type: LlmProviderType.ANTHROPIC,
      apiKey: 'test-anthropic-key',
      model: 'claude-test-model',
      temperature: 0.8,
      enabled: true,
    };
    service = new AnthropicProviderService(config);
    service.setCacheService(mockCacheService);
    
    // Reset mocks before each test
    mockedAxios.post.mockClear();
    mockCacheService.get.mockClear();
    mockCacheService.set.mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPrompt (without cache)', () => {
    const prompt = 'Test Anthropic prompt';
    const systemPrompt = 'System instruction for Claude';
    const mockApiResponse = {
      data: {
        content: [
          { type: 'text', text: 'Mock Claude response' }
        ],
      },
    };
    const expectedResponse: LlmResponse = {
      content: 'Mock Claude response',
      isError: false,
    };

    it('should call Anthropic API with system prompt and return successful response', async () => {
      mockCacheService.get.mockReturnValue(null); // Cache miss
      mockedAxios.post.mockResolvedValue(mockApiResponse);

      const result = await service.sendPromptWithCache(prompt, systemPrompt);

      expect(mockCacheService.get).toHaveBeenCalledWith(prompt, systemPrompt, config.type, config.model);
      const expectedUrl = 'https://api.anthropic.com/v1/messages';
      const expectedBody = {
        model: config.model,
        max_tokens: 1024, // Default used by the service
        temperature: config.temperature,
        system: systemPrompt,
        messages: [
          { role: 'user', content: prompt }
        ]
      };
      const expectedHeaders = {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      };
      expect(mockedAxios.post).toHaveBeenCalledWith(expectedUrl, expectedBody, { headers: expectedHeaders });
      expect(mockCacheService.set).toHaveBeenCalledWith(prompt, systemPrompt, config.type, config.model, expectedResponse);
      expect(result).toEqual(expectedResponse);
    });
    
    it('should call Anthropic API without system prompt if not provided', async () => {
      mockCacheService.get.mockReturnValue(null); 
      mockedAxios.post.mockResolvedValue(mockApiResponse);

      await service.sendPromptWithCache(prompt); // No system prompt
      
      const expectedBody = {
        model: config.model,
        max_tokens: 1024, 
        temperature: config.temperature,
        messages: [
          { role: 'user', content: prompt }
        ]
        // No 'system' key
      };
      expect(mockedAxios.post).toHaveBeenCalledWith(expect.any(String), expectedBody, expect.any(Object));
    });

    it('should handle API error gracefully', async () => {
      mockCacheService.get.mockReturnValue(null);
      const errorMessage = 'Invalid API Key';
      const errorResponse = { response: { data: { error: { message: errorMessage } } } };
      mockedAxios.post.mockRejectedValue(errorResponse);

      const result = await service.sendPromptWithCache(prompt, systemPrompt);

      expect(mockedAxios.post).toHaveBeenCalled();
      expect(mockCacheService.set).not.toHaveBeenCalled();
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toContain(errorMessage);
    });
    
    it('should return error if provider is disabled', async () => {
      service.updateConfig({ enabled: false });
      const result = await service.sendPromptWithCache(prompt);
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toContain('disabled');
    });
    
     it('should handle empty content in API response', async () => {
      mockCacheService.get.mockReturnValue(null);
      const emptyResponse = { data: { content: [{ type: 'text', text: '' }] } };
      mockedAxios.post.mockResolvedValue(emptyResponse);

      const result = await service.sendPromptWithCache(prompt);

      expect(mockedAxios.post).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalledWith(prompt, undefined, config.type, config.model, { content: '', isError: false });
      expect(result.isError).toBe(false);
      expect(result.content).toEqual('');
    });
  });

  describe('sendPromptWithCache (Cache Interaction)', () => {
     const prompt = 'Anthropic cached prompt';
     const systemPrompt = 'Anthropic cached system';
     const cachedResponse: LlmResponse = {
       content: 'This came from Anthropic cache',
       isError: false,
     };

    it('should return cached response if available', async () => {
      mockCacheService.get.mockReturnValue(cachedResponse);
      const result = await service.sendPromptWithCache(prompt, systemPrompt);
      expect(mockCacheService.get).toHaveBeenCalledWith(prompt, systemPrompt, config.type, config.model);
      expect(mockedAxios.post).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResponse);
    });

    it('should call API and cache response if not in cache', async () => {
       const apiResponse = { data: { content: [{ type: 'text', text: 'Fresh Anthropic API response' }] } };
       const expectedResult: LlmResponse = { content: 'Fresh Anthropic API response', isError: false };
       mockCacheService.get.mockReturnValue(null); 
       mockedAxios.post.mockResolvedValue(apiResponse);
       
       const result = await service.sendPromptWithCache(prompt, systemPrompt);
       
       expect(mockCacheService.get).toHaveBeenCalledWith(prompt, systemPrompt, config.type, config.model);
       expect(mockedAxios.post).toHaveBeenCalled();
       expect(mockCacheService.set).toHaveBeenCalledWith(prompt, systemPrompt, config.type, config.model, expectedResult);
       expect(result).toEqual(expectedResult);
    });
  });
}); 