import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { LlmProviderService } from './llm-provider.service';
import { LlmProviderConfig, LlmProviderType, LlmResponse } from 'src/dto/llm-provider.dto';

@Injectable()
export class AnthropicProviderService extends LlmProviderService {
  constructor(config: LlmProviderConfig) {
    super(config);
    
    // Set default model if not specified
    if (!this.config.model) {
      this.config.model = 'claude-3-haiku-20240307';
    }
    
    this.logger.log(`Anthropic provider initialized with model: ${this.config.model}`);
  }

  /**
   * Send a prompt to Anthropic Claude and get a response
   */
  async sendPrompt(prompt: string, systemPrompt?: string): Promise<LlmResponse> {
    if (!this.isEnabled()) {
      return {
        content: '',
        isError: true,
        errorMessage: 'Anthropic provider is not enabled',
      };
    }

    try {
      const requestBody: any = {
        model: this.config.model,
        max_tokens: 1024,
        temperature: this.config.temperature,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      };

      // Add system prompt if provided
      if (systemPrompt) {
        requestBody.system = systemPrompt;
      }

      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.config.apiKey,
            'anthropic-version': '2023-06-01',
          },
        },
      );

      const content = response.data.content?.[0]?.text;
      if (!content) {
        return {
          content: '',
          isError: true,
          errorMessage: 'Empty response from Anthropic',
        };
      }

      return {
        content,
        isError: false,
      };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      this.logger.error(`Anthropic API error: ${errorMessage}`, error.stack);
      
      return {
        content: '',
        isError: true,
        errorMessage: `Anthropic API error: ${errorMessage}`,
      };
    }
  }
} 