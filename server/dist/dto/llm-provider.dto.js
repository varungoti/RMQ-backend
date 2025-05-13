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
exports.LlmProviderConfig = exports.LlmProviderType = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var LlmProviderType;
(function (LlmProviderType) {
    LlmProviderType["OPENAI"] = "openai";
    LlmProviderType["GEMINI"] = "gemini";
    LlmProviderType["ANTHROPIC"] = "anthropic";
    LlmProviderType["COHERE"] = "cohere";
    LlmProviderType["AZURE_OPENAI"] = "azure_openai";
})(LlmProviderType || (exports.LlmProviderType = LlmProviderType = {}));
class LlmProviderConfig {
    constructor() {
        this.temperature = 0.7;
        this.enabled = true;
    }
}
exports.LlmProviderConfig = LlmProviderConfig;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: LlmProviderType, description: 'Type of the LLM provider' }),
    (0, class_validator_1.IsEnum)(LlmProviderType),
    __metadata("design:type", String)
], LlmProviderConfig.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'API key for the provider (sensitive)', example: 'sk-xxxxxxxx' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LlmProviderConfig.prototype, "apiKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Specific model to use (e.g., gpt-4, gemini-pro)', example: 'gpt-3.5-turbo' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], LlmProviderConfig.prototype, "model", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sampling temperature (0-2)', default: 0.7, minimum: 0, maximum: 2 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(2),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], LlmProviderConfig.prototype, "temperature", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Whether this provider configuration is enabled', default: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], LlmProviderConfig.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Custom endpoint URL (e.g., for Azure OpenAI)', example: 'https://your-azure-resource.openai.azure.com/' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], LlmProviderConfig.prototype, "endpoint", void 0);
//# sourceMappingURL=llm-provider.dto.js.map