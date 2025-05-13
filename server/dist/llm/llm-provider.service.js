"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmProviderService = void 0;
const common_1 = require("@nestjs/common");
class LlmProviderService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(this.constructor.name);
    }
    setCacheService(cacheService) {
        this.cacheService = cacheService;
    }
    getConfig() {
        return this.config;
    }
    isEnabled() {
        return this.config.enabled && this.config.apiKey && this.config.apiKey.length > 0;
    }
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    async sendPromptWithCache(prompt, systemPrompt) {
        if (!this.cacheService) {
            return this.sendPrompt(prompt, systemPrompt);
        }
        const cachedResponse = await Promise.resolve(this.cacheService.get(prompt, systemPrompt, this.config.type, this.config.model || ''));
        if (cachedResponse) {
            this.logger.log(`Using cached response for provider ${this.config.type} and model ${this.config.model}`);
            return cachedResponse;
        }
        const response = await this.sendPrompt(prompt, systemPrompt);
        if (!response.isError) {
            await Promise.resolve(this.cacheService.set(prompt, systemPrompt, this.config.type, this.config.model || '', response));
        }
        return response;
    }
}
exports.LlmProviderService = LlmProviderService;
//# sourceMappingURL=llm-provider.service.js.map