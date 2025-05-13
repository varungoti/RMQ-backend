import { LlmProviderService } from './llm-provider.service';
import { LlmProviderConfig, LlmResponse } from 'src/dto/llm-provider.dto';
export declare class AnthropicProviderService extends LlmProviderService {
    constructor(config: LlmProviderConfig);
    sendPrompt(prompt: string, systemPrompt?: string): Promise<LlmResponse>;
}
