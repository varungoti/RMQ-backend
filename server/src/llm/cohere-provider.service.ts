import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { LlmProviderService } from './llm-provider.service';
import { LlmProviderConfig, LlmProviderType, LlmResponse } from '../dto/llm-provider.dto';

@Injectable()
export class CohereProviderService extends LlmProviderService {
  constructor(config: LlmProviderConfig) {
    super(config);
    
    // Set default model if not specified
    if (!this.config.model) {
      this.config.model = 'command';
    }
    
    this.logger.log(`Cohere provider initialized with model: ${this.config.model}`);
  }

  /**
   * Send a prompt to Cohere and get a response
   */
  async sendPrompt(prompt: string, systemPrompt?: string): Promise<LlmResponse> {
    if (!this.isEnabled()) {
      return {
        content: '',
        isError: true,
        errorMessage: 'Cohere provider is not enabled',
      };
    }

    try {
      const messages = [];
      
      if (systemPrompt) {
        messages.push({
          role: 'SYSTEM',
          message: systemPrompt,
        });
      }
      
      messages.push({
        role: 'USER',
        message: prompt,
      });
      
      const response = await axios.post(
        'https://api.cohere.ai/v1/chat',
        {
          model: this.config.model,
          chat_history: messages.length > 1 ? messages.slice(0, -1) : [],
          message: prompt,
          temperature: this.config.temperature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
        },
      );

      const content = response.data.text;
      if (!content) {
        return {
          content: '',
          isError: true,
          errorMessage: 'Empty response from Cohere',
        };
      }

      return {
        content,
        isError: false,
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      this.logger.error(`Cohere API error: ${errorMessage}`, error.stack);
      
      return {
        content: '',
        isError: true,
        errorMessage: `Cohere API error: ${errorMessage}`,
      };
    }
  }
} 