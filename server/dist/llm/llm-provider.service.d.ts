import { Logger } from '@nestjs/common';
import { LlmProviderConfig, LlmResponse } from 'src/dto/llm-provider.dto';
export interface ILlmCacheService {
    get(prompt: string, systemPrompt: string | undefined, provider: string, model: string): Promise<LlmResponse | null> | LlmResponse | null;
    set(prompt: string, systemPrompt: string | undefined, provider: string, model: string, response: LlmResponse): Promise<void> | void;
}
export declare abstract class LlmProviderService {
    protected readonly logger: Logger;
    protected config: LlmProviderConfig;
    protected cacheService?: ILlmCacheService;
    constructor(config: LlmProviderConfig);
    setCacheService(cacheService: ILlmCacheService): void;
    getConfig(): LlmProviderConfig;
    isEnabled(): boolean;
    updateConfig(config: Partial<LlmProviderConfig>): void;
    sendPromptWithCache(prompt: string, systemPrompt?: string): Promise<LlmResponse>;
    abstract sendPrompt(prompt: string, systemPrompt?: string): Promise<LlmResponse>;
}
