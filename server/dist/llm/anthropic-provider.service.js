"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicProviderService = void 0;
const axios_1 = require("axios");
const common_1 = require("@nestjs/common");
const llm_provider_service_1 = require("./llm-provider.service");
const llm_provider_dto_1 = require("../dto/llm-provider.dto");
let AnthropicProviderService = class AnthropicProviderService extends llm_provider_service_1.LlmProviderService {
    constructor(config) {
        super(config);
        if (!this.config.model) {
            this.config.model = 'claude-3-haiku-20240307';
        }
        this.logger.log(`Anthropic provider initialized with model: ${this.config.model}`);
    }
    async sendPrompt(prompt, systemPrompt) {
        if (!this.isEnabled()) {
            return {
                content: '',
                isError: true,
                errorMessage: 'Anthropic provider is not enabled',
            };
        }
        try {
            const requestBody = {
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
            if (systemPrompt) {
                requestBody.system = systemPrompt;
            }
            const response = await axios_1.default.post('https://api.anthropic.com/v1/messages', requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.config.apiKey,
                    'anthropic-version': '2023-06-01',
                },
            });
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
        }
        catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message;
            this.logger.error(`Anthropic API error: ${errorMessage}`, error.stack);
            return {
                content: '',
                isError: true,
                errorMessage: `Anthropic API error: ${errorMessage}`,
            };
        }
    }
};
exports.AnthropicProviderService = AnthropicProviderService;
exports.AnthropicProviderService = AnthropicProviderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [llm_provider_dto_1.LlmProviderConfig])
], AnthropicProviderService);
//# sourceMappingURL=anthropic-provider.service.js.map