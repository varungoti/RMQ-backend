import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { LlmProviderConfig, LlmProviderType, LlmResponse } from '../dto/llm-provider.dto';
import { LlmCacheService } from './llm-cache.service';
import { OpenAiProviderService } from './openai-provider.service';

// Mock axios post method
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock Cache Service
const mockCacheService: jest.Mocked<LlmCacheService> = {
  get: jest.fn(),
  set: jest.fn(),
  // Add other methods if needed, mocked
  getStats: jest.fn(),
  clearCache: jest.fn(),
  resetMetrics: jest.fn(),
  clearProviderCache: jest.fn(),
} as any;

describe('OpenAiProviderService', () => {
  let service: OpenAiProviderService;
  let config: LlmProviderConfig;

  beforeEach(() => {
    config = {
      type: LlmProviderType.OPENAI,
      apiKey: 'test-openai-key',
      model: 'gpt-test-model',
      temperature: 0.5,
      enabled: true,
    };
    service = new OpenAiProviderService(config);
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
    const prompt = 'Test prompt';
    const systemPrompt = 'System prompt';
    const mockApiResponse = {
      data: {
        choices: [
          {
            message: {
              content: 'Mock OpenAI response',
            },
          },
        ],
      },
    };
    const expectedResponse: LlmResponse = {
      content: 'Mock OpenAI response',
      isError: false,
    };

    it('should call OpenAI API and return successful response', async () => {
      mockCacheService.get.mockReturnValue(null); // Cache miss
      mockedAxios.post.mockResolvedValue(mockApiResponse);

      const result = await service.sendPromptWithCache(prompt, systemPrompt);

      expect(mockCacheService.get).toHaveBeenCalledWith(prompt, systemPrompt, config.type, config.model);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        {
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: config.temperature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
          },
        },
      );
      expect(mockCacheService.set).toHaveBeenCalledWith(prompt, systemPrompt, config.type, config.model, expectedResponse);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle API error gracefully', async () => {
      mockCacheService.get.mockReturnValue(null); // Cache miss
      const errorMessage = 'Network Error';
      mockedAxios.post.mockRejectedValue(new Error(errorMessage));

      const result = await service.sendPromptWithCache(prompt, systemPrompt);

      expect(mockedAxios.post).toHaveBeenCalled();
      expect(mockCacheService.set).not.toHaveBeenCalled(); // Should not cache error response
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toContain(errorMessage);
    });

    it('should return error if provider is disabled', async () => {
      service.updateConfig({ enabled: false }); // Disable the provider
      const result = await service.sendPromptWithCache(prompt);

      expect(mockCacheService.get).not.toHaveBeenCalled();
      expect(mockedAxios.post).not.toHaveBeenCalled();
      expect(result.isError).toBe(true);
      expect(result.errorMessage).toContain('disabled');
    });

     it('should handle empty content in API response', async () => {
      mockCacheService.get.mockReturnValue(null);
      const emptyResponse = { data: { choices: [{ message: { content: '' } }] } };
      mockedAxios.post.mockResolvedValue(emptyResponse);

      const result = await service.sendPromptWithCache(prompt);

      expect(mockedAxios.post).toHaveBeenCalled();
      // Should still cache the empty (but successful) response
      expect(mockCacheService.set).toHaveBeenCalledWith(prompt, undefined, config.type, config.model, { content: '', isError: false }); 
      expect(result.isError).toBe(false);
      expect(result.content).toEqual('');
    });
  });

  describe('sendPromptWithCache (Cache Interaction)', () => {
     const prompt = 'Cached prompt';
     const systemPrompt = 'Cached system';
     const cachedResponse: LlmResponse = {
       content: 'This came from cache',
       isError: false,
     };

    it('should return cached response if available', async () => {
      mockCacheService.get.mockReturnValue(cachedResponse);

      const result = await service.sendPromptWithCache(prompt, systemPrompt);

      expect(mockCacheService.get).toHaveBeenCalledWith(prompt, systemPrompt, config.type, config.model);
      expect(mockedAxios.post).not.toHaveBeenCalled();
      expect(mockCacheService.set).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResponse);
    });

    it('should call API and cache response if not in cache', async () => {
       const apiResponse = { data: { choices: [{ message: { content: 'Fresh API response' } }] } };
       const expectedResult: LlmResponse = { content: 'Fresh API response', isError: false };
       mockCacheService.get.mockReturnValue(null); // Cache miss
       mockedAxios.post.mockResolvedValue(apiResponse);
       
       const result = await service.sendPromptWithCache(prompt, systemPrompt);
       
       expect(mockCacheService.get).toHaveBeenCalledWith(prompt, systemPrompt, config.type, config.model);
       expect(mockedAxios.post).toHaveBeenCalled();
       expect(mockCacheService.set).toHaveBeenCalledWith(prompt, systemPrompt, config.type, config.model, expectedResult);
       expect(result).toEqual(expectedResult);
    });
  });
}); 