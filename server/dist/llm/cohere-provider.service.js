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
exports.CohereProviderService = void 0;
const axios_1 = require("axios");
const common_1 = require("@nestjs/common");
const llm_provider_service_1 = require("./llm-provider.service");
const llm_provider_dto_1 = require("../dto/llm-provider.dto");
let CohereProviderService = class CohereProviderService extends llm_provider_service_1.LlmProviderService {
    constructor(config) {
        super(config);
        if (!this.config.model) {
            this.config.model = 'command';
        }
        this.logger.log(`Cohere provider initialized with model: ${this.config.model}`);
    }
    async sendPrompt(prompt, systemPrompt) {
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
            const response = await axios_1.default.post('https://api.cohere.ai/v1/chat', {
                model: this.config.model,
                chat_history: messages.length > 1 ? messages.slice(0, -1) : [],
                message: prompt,
                temperature: this.config.temperature,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`,
                },
            });
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
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            this.logger.error(`Cohere API error: ${errorMessage}`, error.stack);
            return {
                content: '',
                isError: true,
                errorMessage: `Cohere API error: ${errorMessage}`,
            };
        }
    }
};
exports.CohereProviderService = CohereProviderService;
exports.CohereProviderService = CohereProviderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [llm_provider_dto_1.LlmProviderConfig])
], CohereProviderService);
//# sourceMappingURL=cohere-provider.service.js.map