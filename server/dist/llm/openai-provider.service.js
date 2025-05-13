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
exports.OpenAiProviderService = void 0;
const axios_1 = require("axios");
const common_1 = require("@nestjs/common");
const llm_provider_service_1 = require("./llm-provider.service");
const llm_provider_dto_1 = require("../dto/llm-provider.dto");
let OpenAiProviderService = class OpenAiProviderService extends llm_provider_service_1.LlmProviderService {
    constructor(config) {
        super(config);
        if (!this.config.model) {
            this.config.model = 'gpt-3.5-turbo';
        }
        this.logger.log(`OpenAI provider initialized with model: ${this.config.model}`);
    }
    async sendPrompt(prompt, systemPrompt) {
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
            const response = await axios_1.default.post('https://api.openai.com/v1/chat/completions', {
                model: this.config.model,
                messages,
                temperature: this.config.temperature,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`,
                },
            });
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
        }
        catch (error) {
            this.logger.error(`OpenAI API error: ${error.message}`, error.stack);
            return {
                content: '',
                isError: true,
                errorMessage: `OpenAI API error: ${error.message}`,
            };
        }
    }
};
exports.OpenAiProviderService = OpenAiProviderService;
exports.OpenAiProviderService = OpenAiProviderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [llm_provider_dto_1.LlmProviderConfig])
], OpenAiProviderService);
//# sourceMappingURL=openai-provider.service.js.map