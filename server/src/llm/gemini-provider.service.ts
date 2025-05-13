import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { LlmProviderService } from './llm-provider.service';
import { LlmProviderConfig, LlmProviderType, LlmResponse } from '../dto/llm-provider.dto';

@Injectable()
export class GeminiProviderService extends LlmProviderService {
  private readonly apiBaseUrl: string;
  
  constructor(config: LlmProviderConfig) {
    super(config);
    
    // Set default model if not specified - use Gemini 2.5 Pro as default
    if (!this.config.model) {
      this.config.model = 'gemini-2.5-pro';
    }
    
    this.apiBaseUrl = 'https://generativelanguage.googleapis.com/v1';
    this.logger.log(`Gemini provider initialized with model: ${this.config.model}`);
  }

  /**
   * Send a prompt to Google Gemini and get a response
   */
  async sendPrompt(prompt: string, systemPrompt?: string): Promise<LlmResponse> {
    if (!this.isEnabled()) {
      return {
        content: '',
        isError: true,
        errorMessage: 'Gemini provider is not enabled',
      };
    }

    try {
      // For Gemini 1.5 Pro and higher, we can use system prompts
      // For earlier models, we need to combine system and user prompts
      const endpoint = `${this.apiBaseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;
      
      let requestBody;
      const supportsSystemPrompt = this.config.model.includes('1.5') || this.config.model.includes('2');

      if (supportsSystemPrompt && systemPrompt) {
        // Use separate system and user prompts for models that support it
        requestBody = {
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: this.config.temperature,
          },
        };
      } else {
        // Combine prompts for models that don't support system instructions
        const combinedPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
        requestBody = {
          contents: [
            {
              role: 'user',
              parts: [{ text: combinedPrompt }]
            }
          ],
          generationConfig: {
            temperature: this.config.temperature,
          },
        };
      }

      const response = await axios.post(endpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Extract content from the response
      const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        return {
          content: '',
          isError: true,
          errorMessage: 'Empty response from Gemini',
        };
      }

      return {
        content,
        isError: false,
      };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      this.logger.error(`Gemini API error: ${errorMessage}`, error.stack);
      
      return {
        content: '',
        isError: true,
        errorMessage: `Gemini API error: ${errorMessage}`,
      };
    }
  }
} 