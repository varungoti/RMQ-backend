import { LlmProviderService } from './llm-provider.service';
import { LlmProviderConfig, LlmResponse } from '../dto/llm-provider.dto';
export declare class OpenAiProviderService extends LlmProviderService {
    constructor(config: LlmProviderConfig);
    sendPrompt(prompt: string, systemPrompt?: string): Promise<LlmResponse>;
}
