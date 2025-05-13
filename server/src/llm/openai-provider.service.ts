import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { LlmProviderService } from './llm-provider.service';
import { LlmProviderConfig, LlmProviderType, LlmResponse } from '../dto/llm-provider.dto';

@Injectable()
export class OpenAiProviderService extends LlmProviderService {
  constructor(config: LlmProviderConfig) {
    super(config);
    
    // Set default model if not specified
    if (!this.config.model) {
      this.config.model = 'gpt-3.5-turbo';
    }
    
    this.logger.log(`OpenAI provider initialized with model: ${this.config.model}`);
  }

  /**
   * Send a prompt to OpenAI and get a response
   */
  async sendPrompt(prompt: string, systemPrompt?: string): Promise<LlmResponse> {
    if (!this.isEnabled()) {
      return {
        content: '',
        isError: true,
        errorMessage: 'OpenAI provider is not enabled',
      };
    }

    try {
      const messages = [];
      
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt,
        });
      }
      
      messages.push({
        role: 'user',
        content: prompt,
      });

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.config.model,
          messages,
          temperature: this.config.temperature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
        },
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        return {
          content: '',
          isError: true,
          errorMessage: 'Empty response from OpenAI',
        };
      }

      return {
        content,
        isError: false,
      };
    } catch (error) {
      this.logger.error(`OpenAI API error: ${error.message}`, error.stack);
      
      return {
        content: '',
        isError: true,
        errorMessage: `OpenAI API error: ${error.message}`,
      };
    }
  }
} 