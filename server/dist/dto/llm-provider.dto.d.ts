export declare enum LlmProviderType {
    OPENAI = "openai",
    GEMINI = "gemini",
    ANTHROPIC = "anthropic",
    COHERE = "cohere",
    AZURE_OPENAI = "azure_openai"
}
export declare class LlmProviderConfig {
    type: LlmProviderType;
    apiKey: string;
    model?: string;
    temperature?: number;
    enabled?: boolean;
    endpoint?: string;
}
export interface LlmResponse {
    content: string;
    isError: boolean;
    errorMessage?: string;
    fromCache?: boolean;
}
