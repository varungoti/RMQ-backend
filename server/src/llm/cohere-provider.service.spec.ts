import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { LlmProviderConfig, LlmProviderType, LlmResponse } from '../dto/llm-provider.dto';
import { LlmCacheService } from './llm-cache.service'; 
import { CohereProviderService } from './cohere-provider.service';

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

describe('CohereProviderService', () => {
  let service: CohereProviderService;
  let config: LlmProviderConfig;

  beforeEach(() => {
    config = {
      type: LlmProviderType.COHERE,
      apiKey: 'test-cohere-key',
      model: 'command-test',
      temperature: 0.3,
      enabled: true,
    };
    service = new CohereProviderService(config);
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
    const prompt = 'Test Cohere prompt';
    const systemPrompt = 'System preamble for Cohere';
    const mockApiResponse = {
      data: {
        text: 'Mock Cohere response',
        // Cohere might return other fields like citations, chat_history etc.
      },
    };
    const expectedResponse: LlmResponse = {
      content: 'Mock Cohere response',
      isError: false,
    };

    it('should call Cohere API with system prompt and return successful response', async () => {
      mockCacheService.get.mockReturnValue(null); // Cache miss
      mockedAxios.post.mockResolvedValue(mockApiResponse);

      const result = await service.sendPromptWithCache(prompt, systemPrompt);

      expect(mockCacheService.get).toHaveBeenCalledWith(prompt, systemPrompt, config.type, config.model);
      const expectedUrl = 'https://api.cohere.ai/v1/chat';
      // Cohere's chat endpoint uses `chat_history` for system/previous turns
      // and `message` for the current user prompt.
      const expectedBody = {
        model: config.model,
        chat_history: [
          { role: 'SYSTEM', message: systemPrompt }
        ],
        message: prompt,
        temperature: config.temperature,
      };
      const expectedHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      };
      expect(mockedAxios.post).toHaveBeenCalledWith(expectedUrl, expectedBody, { headers: expectedHeaders });
      expect(mockCacheService.set).toHaveBeenCalledWith(prompt, systemPrompt, config.type, config.model, expectedResponse);
      expect(result).toEqual(expectedResponse);
    });
    
    it('should call Cohere API without chat_history if no system prompt', async () => {
      mockCacheService.get.mockReturnValue(null); 
      mockedAxios.post.mockResolvedValue(mockApiResponse);

      await service.sendPromptWithCache(prompt); // No system prompt
      
      const expectedBody = {
        model: config.model,
        chat_history: [], // Empty history
        message: prompt,
        temperature: config.temperature,
      };
      expect(mockedAxios.post).toHaveBeenCalledWith(expect.any(String), expectedBody, expect.any(Object));
    });

    it('should handle API error gracefully', async () => {
      mockCacheService.get.mockReturnValue(null);
      const errorMessage = 'Authentication failed';
      const errorResponse = { response: { data: { message: errorMessage } } }; // Cohere uses 'message'
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
    
     it('should handle empty text in API response', async () => {
      mockCacheService.get.mockReturnValue(null);
      const emptyResponse = { data: { text: '' } };
      mockedAxios.post.mockResolvedValue(emptyResponse);

      const result = await service.sendPromptWithCache(prompt);

      expect(mockedAxios.post).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalledWith(prompt, undefined, config.type, config.model, { content: '', isError: false });
      expect(result.isError).toBe(false);
      expect(result.content).toEqual('');
    });
  });

  describe('sendPromptWithCache (Cache Interaction)', () => {
     const prompt = 'Cohere cached prompt';
     const systemPrompt = 'Cohere cached system';
     const cachedResponse: LlmResponse = {
       content: 'This came from Cohere cache',
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
       const apiResponse = { data: { text: 'Fresh Cohere API response' } };
       const expectedResult: LlmResponse = { content: 'Fresh Cohere API response', isError: false };
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