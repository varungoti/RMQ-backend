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
var AiRecommendationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiRecommendationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const llm_factory_service_1 = require("./llm/llm-factory.service");
const recommendation_dto_1 = require("./dto/recommendation.dto");
const ai_recommendation_dto_1 = require("./dto/ai-recommendation.dto");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const ai_metrics_service_1 = require("./metrics/ai-metrics.service");
let AiRecommendationService = AiRecommendationService_1 = class AiRecommendationService {
    constructor(configService, llmFactory, aiMetrics) {
        this.configService = configService;
        this.llmFactory = llmFactory;
        this.aiMetrics = aiMetrics;
        this.logger = new common_1.Logger(AiRecommendationService_1.name);
        this.metrics = {
            validationErrors: [],
            parseErrors: [],
            totalAttempts: 0,
            validResponses: 0,
            invalidResponses: 0,
            averageAttempts: 0,
        };
        this.MAX_VALIDATION_ERRORS = 100;
        this.MAX_PARSE_ERRORS = 100;
        this.useAiRecommendations = this.configService.get('USE_AI_RECOMMENDATIONS') !== false;
        if (this.isEnabled()) {
            this.logger.log('AI Recommendations are enabled');
            const defaultProvider = this.llmFactory.getDefaultProvider();
            if (defaultProvider) {
                this.logger.log(`Using LLM provider: ${defaultProvider.constructor.name}`);
            }
            else {
                this.logger.warn('AI Enabled but no default LLM provider found/configured!');
            }
        }
        else {
            this.logger.log('AI Recommendations are disabled');
        }
    }
    isEnabled() {
        return this.useAiRecommendations && this.llmFactory.isAnyProviderEnabled();
    }
    getCurrentProvider() {
        return this.llmFactory.getDefaultProvider().getConfig().type;
    }
    getMetrics() {
        return {
            ...this.metrics,
            averageAttempts: this.metrics.totalAttempts /
                (this.metrics.validResponses + this.metrics.invalidResponses || 1),
        };
    }
    resetMetrics() {
        this.metrics.validationErrors = [];
        this.metrics.parseErrors = [];
        this.metrics.totalAttempts = 0;
        this.metrics.validResponses = 0;
        this.metrics.invalidResponses = 0;
        this.metrics.averageAttempts = 0;
    }
    async generateRecommendation(userId, skill, score, assessmentHistory) {
        if (!this.isEnabled()) {
            this.logger.warn('Attempted to generate AI recommendation, but AI is disabled.');
            return null;
        }
        const llmProvider = this.llmFactory.getDefaultProvider();
        if (!llmProvider) {
            this.logger.error('Cannot generate AI recommendation: No enabled LLM provider found.');
            return null;
        }
        this.metrics.totalAttempts++;
        const startTime = Date.now();
        try {
            const prompt = this._generatePrompt(userId, skill, score, assessmentHistory);
            const systemPrompt = this._generateSystemPrompt();
            this.logger.debug(`Sending prompt to LLM for user ${userId}, skill ${skill.id}`);
            const llmResponse = await llmProvider.sendPromptWithCache(prompt, systemPrompt);
            const responseTime = Date.now() - startTime;
            if (llmResponse.isError || !llmResponse.content) {
                this._recordParseError('EMPTY_RESPONSE', 'LLM returned empty response or error', llmResponse.content || '');
                this.metrics.invalidResponses++;
                await this.aiMetrics.recordRequest(false, responseTime, llmResponse.fromCache, {
                    code: 'EMPTY_RESPONSE',
                    message: 'LLM returned empty response or error',
                    userId,
                    skillId: skill.id,
                    attempt: this.metrics.totalAttempts,
                    provider: this.getCurrentProvider(),
                });
                return null;
            }
            const parsedJson = await this._parseResponse(llmResponse.content);
            if (!parsedJson) {
                this.metrics.invalidResponses++;
                await this.aiMetrics.recordRequest(false, responseTime, llmResponse.fromCache, {
                    code: 'PARSE_ERROR',
                    message: 'Failed to parse LLM response',
                    userId,
                    skillId: skill.id,
                    attempt: this.metrics.totalAttempts,
                    provider: this.getCurrentProvider(),
                });
                return null;
            }
            const validatedDto = await this._validateResponse(parsedJson);
            if (!validatedDto) {
                this.metrics.invalidResponses++;
                await this.aiMetrics.recordRequest(false, responseTime, llmResponse.fromCache, {
                    code: 'VALIDATION_ERROR',
                    message: 'LLM response failed validation',
                    userId,
                    skillId: skill.id,
                    attempt: this.metrics.totalAttempts,
                    provider: this.getCurrentProvider(),
                });
                return null;
            }
            this.metrics.validResponses++;
            await this.aiMetrics.recordRequest(true, responseTime, llmResponse.fromCache);
            return validatedDto;
        }
        catch (error) {
            this.logger.error(`Error during AI recommendation generation: ${error.message}`, error.stack);
            this.metrics.invalidResponses++;
            await this.aiMetrics.recordRequest(false, Date.now() - startTime, false, {
                code: 'INTERNAL_ERROR',
                message: error.message,
                userId,
                skillId: skill.id,
                attempt: this.metrics.totalAttempts,
                provider: this.getCurrentProvider(),
            });
            return null;
        }
    }
    _generateSystemPrompt() {
        return 'You are an educational AI advisor that creates personalized learning recommendations for students based on their performance data.';
    }
    _generatePrompt(userId, skill, score, assessmentHistory) {
        const historyText = assessmentHistory
            .map(h => `- Skill: ${h.skillId}, Correct: ${h.isCorrect}, Date: ${h.date.toISOString()}`)
            .join('\n');
        return `
      Generate a personalized learning recommendation for a student with the following:
      
      - User ID: ${userId}
      - Skill Name: ${skill.name}
      - Skill Description: ${skill.description || 'No description available'}
      - Current Score: ${score} (scores range from 400-800, where 650+ is proficient)
      - Grade Level: ${skill.gradeLevel}
      
      Recent assessment history:
      ${historyText}
      
      Create a personalized recommendation for this student to improve this skill.
      Respond ONLY with the JSON object, without any additional text or markdown formatting.
      The JSON object must have the following fields:
      {
        "explanation": "Brief explanation of why this resource will help",
        "resourceTitle": "Title of the learning resource",
        "resourceDescription": "Description of the learning resource",
        "resourceType": "${Object.values(recommendation_dto_1.RecommendationType).join('|')}",
        "resourceUrl": "URL to a relevant teaching resource (can be a popular educational site)",
        "priority": "${Object.values(recommendation_dto_1.RecommendationPriority).join('|')}"
      }
    `;
    }
    async _parseResponse(response) {
        try {
            return JSON.parse(response);
        }
        catch (parseError) {
            this.logger.warn('Direct JSON parsing failed, attempting regex extraction...', parseError);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                this._recordParseError('INVALID_JSON_FORMAT', 'Unable to extract JSON from response', response);
                return null;
            }
            try {
                return JSON.parse(jsonMatch[0]);
            }
            catch (regexParseError) {
                this._recordParseError('INVALID_JSON_CONTENT', 'Failed to parse extracted JSON', jsonMatch[0]);
                return null;
            }
        }
    }
    async _validateResponse(parsedJson) {
        if (!parsedJson) {
            this._recordValidationError('NULL_RESPONSE', 'Parsed JSON is null or undefined', [], null);
            return null;
        }
        const recommendationDto = (0, class_transformer_1.plainToInstance)(ai_recommendation_dto_1.AiGeneratedRecommendationDto, parsedJson);
        const errors = await (0, class_validator_1.validate)(recommendationDto);
        if (errors.length > 0) {
            this._recordValidationError('VALIDATION_FAILED', 'LLM response failed validation', errors, parsedJson);
            return null;
        }
        return recommendationDto;
    }
    _recordValidationError(code, message, errors, rawResponse) {
        const error = { code, message, details: errors, rawResponse };
        this.metrics.validationErrors.push(error);
        if (this.metrics.validationErrors.length > this.MAX_VALIDATION_ERRORS) {
            this.metrics.validationErrors.shift();
        }
        this.logger.error(`LLM Validation Error: ${message}`, {
            code,
            errors: errors.map(e => e.toString()),
            rawResponse,
        });
    }
    _recordParseError(code, message, response) {
        const error = { code, message, response };
        this.metrics.parseErrors.push(error);
        if (this.metrics.parseErrors.length > this.MAX_PARSE_ERRORS) {
            this.metrics.parseErrors.shift();
        }
        this.logger.error(`LLM Parse Error: ${message}`, {
            code,
            response,
        });
    }
};
exports.AiRecommendationService = AiRecommendationService;
exports.AiRecommendationService = AiRecommendationService = AiRecommendationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        llm_factory_service_1.LlmFactoryService,
        ai_metrics_service_1.AiMetricsService])
], AiRecommendationService);
//# sourceMappingURL=ai-recommendation.service.js.map