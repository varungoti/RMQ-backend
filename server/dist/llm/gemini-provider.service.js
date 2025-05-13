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
exports.GeminiProviderService = void 0;
const axios_1 = require("axios");
const common_1 = require("@nestjs/common");
const llm_provider_service_1 = require("./llm-provider.service");
const llm_provider_dto_1 = require("../dto/llm-provider.dto");
let GeminiProviderService = class GeminiProviderService extends llm_provider_service_1.LlmProviderService {
    constructor(config) {
        super(config);
        if (!this.config.model) {
            this.config.model = 'gemini-2.5-pro';
        }
        this.apiBaseUrl = 'https://generativelanguage.googleapis.com/v1';
        this.logger.log(`Gemini provider initialized with model: ${this.config.model}`);
    }
    async sendPrompt(prompt, systemPrompt) {
        if (!this.isEnabled()) {
            return {
                content: '',
                isError: true,
                errorMessage: 'Gemini provider is not enabled',
            };
        }
        try {
            const endpoint = `${this.apiBaseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;
            let requestBody;
            const supportsSystemPrompt = this.config.model.includes('1.5') || this.config.model.includes('2');
            if (supportsSystemPrompt && systemPrompt) {
                requestBody = {
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: prompt }]
                        }
                    ],
                    systemInstruction: {
                        parts: [{ text: systemPrompt }]
                    },
                    generationConfig: {
                        temperature: this.config.temperature,
                    },
                };
            }
            else {
                const combinedPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
                requestBody = {
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: combinedPrompt }]
                        }
                    ],
                    generationConfig: {
                        temperature: this.config.temperature,
                    },
                };
            }
            const response = await axios_1.default.post(endpoint, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!content) {
                return {
                    content: '',
                    isError: true,
                    errorMessage: 'Empty response from Gemini',
                };
            }
            return {
                content,
                isError: false,
            };
        }
        catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message;
            this.logger.error(`Gemini API error: ${errorMessage}`, error.stack);
            return {
                content: '',
                isError: true,
                errorMessage: `Gemini API error: ${errorMessage}`,
            };
        }
    }
};
exports.GeminiProviderService = GeminiProviderService;
exports.GeminiProviderService = GeminiProviderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [llm_provider_dto_1.LlmProviderConfig])
], GeminiProviderService);
//# sourceMappingURL=gemini-provider.service.js.map