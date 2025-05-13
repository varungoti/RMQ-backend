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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AiRecommendationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiRecommendationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const llm_factory_service_1 = require("./llm/llm-factory.service");
const recommendation_dto_1 = require("./dto/recommendation.dto");
const ai_recommendation_dto_1 = require("./dto/ai-recommendation.dto");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const ai_metrics_service_1 = require("./metrics/ai-metrics.service");
const recommendation_feedback_entity_1 = require("./entities/recommendation_feedback.entity");
let AiRecommendationService = AiRecommendationService_1 = class AiRecommendationService {
    constructor(configService, llmFactory, aiMetrics, feedbackRepository) {
        this.configService = configService;
        this.llmFactory = llmFactory;
        this.aiMetrics = aiMetrics;
        this.feedbackRepository = feedbackRepository;
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
        const feedbackHistory = await this._getFeedbackHistory(userId, skill.id);
        const feedbackInsights = this._analyzeFeedbackHistory(feedbackHistory);
        this.metrics.totalAttempts++;
        const startTime = Date.now();
        try {
            const prompt = this._generatePrompt(userId, skill, score, assessmentHistory, feedbackInsights);
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
        return `You are an educational AI advisor that creates personalized learning recommendations for students based on their performance data and previous feedback on recommendations.`;
    }
    _generatePrompt(userId, skill, score, assessmentHistory, feedbackInsights) {
        const historyText = assessmentHistory
            .map(h => `- Skill: ${h.skillId}, Correct: ${h.isCorrect}, Date: ${h.date.toISOString()}`)
            .join('\n');
        const feedbackText = `
      Based on previous feedback:
      - Preferred resource types: ${feedbackInsights.preferredTypes.join(', ') || 'No clear preference'}
      - Resource types to avoid: ${feedbackInsights.avoidedTypes.join(', ') || 'None'}
      - Difficulty preference: ${feedbackInsights.difficultyPreference}
      - Common issues: ${feedbackInsights.commonIssues.join(', ') || 'None identified'}
    `;
        return `
      Generate a personalized learning recommendation for a student with the following:
      
      - User ID: ${userId}
      - Skill Name: ${skill.name}
      - Skill Description: ${skill.description || 'No description available'}
      - Current Score: ${score} (scores range from 400-800, where 650+ is proficient)
      - Grade Level: ${skill.gradeLevel}
      
      Recent assessment history:
      ${historyText}

      ${feedbackText}
      
      Create a personalized recommendation for this student to improve this skill.
      Consider their feedback history to provide more effective recommendations.
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
    async _getFeedbackHistory(userId, skillId) {
        return this.feedbackRepository.find({
            where: {
                userId,
                recommendation: { skillId },
            },
            order: { createdAt: 'DESC' },
            take: 10,
        });
    }
    _analyzeFeedbackHistory(feedbackHistory) {
        const typeFeedback = new Map();
        let tooEasyCount = 0;
        let tooDifficultCount = 0;
        let appropriateCount = 0;
        const issues = new Map();
        feedbackHistory.forEach(feedback => {
            const resourceType = feedback.metadata?.resourceType;
            if (resourceType) {
                if (!typeFeedback.has(resourceType)) {
                    typeFeedback.set(resourceType, { helpful: 0, notHelpful: 0 });
                }
                const stats = typeFeedback.get(resourceType);
                if (feedback.feedbackType === recommendation_feedback_entity_1.FeedbackType.HELPFUL) {
                    stats.helpful++;
                }
                else if (feedback.feedbackType === recommendation_feedback_entity_1.FeedbackType.NOT_HELPFUL) {
                    stats.notHelpful++;
                }
            }
            switch (feedback.feedbackType) {
                case recommendation_feedback_entity_1.FeedbackType.TOO_EASY:
                    tooEasyCount++;
                    break;
                case recommendation_feedback_entity_1.FeedbackType.TOO_DIFFICULT:
                    tooDifficultCount++;
                    break;
                case recommendation_feedback_entity_1.FeedbackType.HELPFUL:
                    appropriateCount++;
                    break;
            }
            if (feedback.comment) {
                issues.set(feedback.comment, (issues.get(feedback.comment) || 0) + 1);
            }
        });
        const preferredTypes = [];
        const avoidedTypes = [];
        typeFeedback.forEach((stats, type) => {
            const totalFeedback = stats.helpful + stats.notHelpful;
            if (totalFeedback >= 2) {
                const helpfulRate = stats.helpful / totalFeedback;
                if (helpfulRate >= 0.7) {
                    preferredTypes.push(type);
                }
                else if (helpfulRate <= 0.3) {
                    avoidedTypes.push(type);
                }
            }
        });
        let difficultyPreference = 'appropriate';
        const totalDifficultyFeedback = tooEasyCount + tooDifficultCount + appropriateCount;
        if (totalDifficultyFeedback > 0) {
            if (tooEasyCount / totalDifficultyFeedback > 0.5) {
                difficultyPreference = 'harder';
            }
            else if (tooDifficultCount / totalDifficultyFeedback > 0.5) {
                difficultyPreference = 'easier';
            }
        }
        const commonIssues = Array.from(issues.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([issue]) => issue);
        return {
            preferredTypes,
            avoidedTypes,
            difficultyPreference,
            commonIssues,
        };
    }
};
exports.AiRecommendationService = AiRecommendationService;
exports.AiRecommendationService = AiRecommendationService = AiRecommendationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, typeorm_1.InjectRepository)(recommendation_feedback_entity_1.RecommendationFeedback)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        llm_factory_service_1.LlmFactoryService,
        ai_metrics_service_1.AiMetricsService,
        typeorm_2.Repository])
], AiRecommendationService);
//# sourceMappingURL=ai-recommendation.service.js.map