import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Supported LLM providers
 */
export enum LlmProviderType {
  OPENAI = 'openai',
  GEMINI = 'gemini',
  ANTHROPIC = 'anthropic',
  COHERE = 'cohere',
  AZURE_OPENAI = 'azure_openai',
}

/**
 * Configuration for LLM providers
 */
export class LlmProviderConfig {
  @ApiProperty({ enum: LlmProviderType, description: 'Type of the LLM provider' })
  @IsEnum(LlmProviderType)
  type: LlmProviderType;

  @ApiProperty({ description: 'API key for the provider (sensitive)', example: 'sk-xxxxxxxx' })
  @IsString()
  apiKey: string;

  @ApiPropertyOptional({ description: 'Specific model to use (e.g., gpt-4, gemini-pro)', example: 'gpt-3.5-turbo' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ description: 'Sampling temperature (0-2)', default: 0.7, minimum: 0, maximum: 2 })
  @IsNumber()
  @Min(0)
  @Max(2)
  @IsOptional()
  temperature?: number = 0.7;

  @ApiPropertyOptional({ description: 'Whether this provider configuration is enabled', default: true })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean = true;

  @ApiPropertyOptional({ description: 'Custom endpoint URL (e.g., for Azure OpenAI)', example: 'https://your-azure-resource.openai.azure.com/' })
  @IsString()
  @IsOptional()
  endpoint?: string; // For Azure OpenAI and other custom endpoints
}

/**
 * Response format from LLM providers
 */
export interface LlmResponse {
  content: string;
  isError: boolean;
  errorMessage?: string;
  fromCache?: boolean;
} 