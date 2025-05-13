import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { LlmProviderConfig, LlmProviderType, LlmResponse } from 'src/dto/llm-provider.dto';
import { LlmCacheService } from './llm-cache.service'; 
import { GeminiProviderService } from './gemini-provider.service';

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

describe('GeminiProviderService', () => {
  let service: GeminiProviderService;
  let config: LlmProviderConfig;

  beforeEach(() => {
    config = {
      type: LlmProviderType.GEMINI,
      apiKey: 'test-gemini-key',
      model: 'gemini-1.5-pro-latest', // Use a model supporting system prompts for tests
      temperature: 0.6,
      enabled: true,
    };
    service = new GeminiProviderService(config);
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
    const prompt = 'Test Gemini prompt';
    const systemPrompt = 'System instruction';
    const mockApiResponse = {
      data: {
        candidates: [
          {
            content: {
              parts: [
                { text: 'Mock Gemini response' }
              ],
            },
          },
        ],
      },
    };
    const expectedResponse: LlmResponse = {
      content: 'Mock Gemini response',
      isError: false,
    };

    it('should call Gemini API with separate system prompt and return successful response', async () => {
      mockCacheService.get.mockReturnValue(null); // Cache miss
      mockedAxios.post.mockResolvedValue(mockApiResponse);

      const result = await service.sendPromptWithCache(prompt, systemPrompt);

      expect(mockCacheService.get).toHaveBeenCalledWith(prompt, systemPrompt, config.type, config.model);
      const expectedUrl = `https://generativelanguage.googleapis.com/v1/models/${config.model}:generateContent?key=${config.apiKey}`;
      const expectedBody = {
        contents: [
          { role: 'user', parts: [{ text: prompt }] }
        ],
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: config.temperature,
        },
      };
      expect(mockedAxios.post).toHaveBeenCalledWith(expectedUrl, expectedBody, {
        headers: { 'Content-Type': 'application/json' },
      });
      expect(mockCacheService.set).toHaveBeenCalledWith(prompt, systemPrompt, config.type, config.model, expectedResponse);
      expect(result).toEqual(expectedResponse);
    });
    
    it('should combine prompts for models not supporting system instruction', async () => {
      const oldModelConfig = { ...config, model: 'gemini-pro' }; // Model without system prompt support
      service = new GeminiProviderService(oldModelConfig);
      service.setCacheService(mockCacheService);
      
      mockCacheService.get.mockReturnValue(null); 
      mockedAxios.post.mockResolvedValue(mockApiResponse);

      await service.sendPromptWithCache(prompt, systemPrompt);
      
      const combinedPrompt = `${systemPrompt}\n\n${prompt}`;
      const expectedUrl = `https://generativelanguage.googleapis.com/v1/models/${oldModelConfig.model}:generateContent?key=${oldModelConfig.apiKey}`;
      const expectedBody = {
        contents: [
          { role: 'user', parts: [{ text: combinedPrompt }] }
        ],
        generationConfig: {
          temperature: oldModelConfig.temperature,
        },
      };
      expect(mockedAxios.post).toHaveBeenCalledWith(expectedUrl, expectedBody, expect.any(Object)); // Check body mainly
    });

    it('should handle API error gracefully', async () => {
      mockCacheService.get.mockReturnValue(null);
      const errorMessage = 'API Key Invalid';
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
      const emptyResponse = { data: { candidates: [{ content: { parts: [{ text: '' }] } }] } };
      mockedAxios.post.mockResolvedValue(emptyResponse);

      const result = await service.sendPromptWithCache(prompt);

      expect(mockedAxios.post).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalledWith(prompt, undefined, config.type, config.model, { content: '', isError: false });
      expect(result.isError).toBe(false);
      expect(result.content).toEqual('');
    });
  });

  describe('sendPromptWithCache (Cache Interaction)', () => {
     const prompt = 'Gemini cached prompt';
     const systemPrompt = 'Gemini cached system';
     const cachedResponse: LlmResponse = {
       content: 'This came from Gemini cache',
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
       const apiResponse = { data: { candidates: [{ content: { parts: [{ text: 'Fresh Gemini API response' }] } }] } };
       const expectedResult: LlmResponse = { content: 'Fresh Gemini API response', isError: false };
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