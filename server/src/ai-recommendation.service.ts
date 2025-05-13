import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmFactoryService } from './llm/llm-factory.service';
import { RecommendationType, RecommendationPriority } from './dto/recommendation.dto';
import { LlmProviderType } from './dto/llm-provider.dto';
import { Skill } from './entities/skill.entity';
import { AiGeneratedRecommendationDto } from './dto/ai-recommendation.dto';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { AiMetricsService } from './metrics/ai-metrics.service';
import { RecommendationFeedback, FeedbackType } from './entities/recommendation_feedback.entity';

interface LlmValidationError {
  code: string;
  message: string;
  details: ValidationError[];
  rawResponse: any;
}

interface LlmResponseMetrics {
  validationErrors: LlmValidationError[];
  parseErrors: Array<{ code: string; message: string; response: string }>;
  totalAttempts: number;
  validResponses: number;
  invalidResponses: number;
  averageAttempts: number;
}

@Injectable()
export class AiRecommendationService {
  private readonly logger = new Logger(AiRecommendationService.name);
  private readonly useAiRecommendations: boolean;
  private readonly metrics: LlmResponseMetrics = {
    validationErrors: [],
    parseErrors: [],
    totalAttempts: 0,
    validResponses: 0,
    invalidResponses: 0,
    averageAttempts: 0,
  };
  private readonly MAX_VALIDATION_ERRORS = 100;
  private readonly MAX_PARSE_ERRORS = 100;

  constructor(
    private configService: ConfigService,
    private llmFactory: LlmFactoryService,
    private aiMetrics: AiMetricsService,
    @InjectRepository(RecommendationFeedback)
    private readonly feedbackRepository: Repository<RecommendationFeedback>,
  ) {
    this.useAiRecommendations = this.configService.get<boolean>('USE_AI_RECOMMENDATIONS') !== false;
    
    if (this.isEnabled()) {
      this.logger.log('AI Recommendations are enabled');
      const defaultProvider = this.llmFactory.getDefaultProvider();
      if (defaultProvider) {
        this.logger.log(`Using LLM provider: ${defaultProvider.constructor.name}`);
      } else {
        this.logger.warn('AI Enabled but no default LLM provider found/configured!');
      }
    } else {
      this.logger.log('AI Recommendations are disabled');
    }
  }

  /**
   * Check if AI recommendations are enabled
   */
  isEnabled(): boolean {
    return this.useAiRecommendations && this.llmFactory.isAnyProviderEnabled();
  }

  getCurrentProvider(): string {
    return this.llmFactory.getDefaultProvider().getConfig().type;
  }

  /**
   * Get current LLM response metrics
   */
  getMetrics(): LlmResponseMetrics {
    return {
      ...this.metrics,
      averageAttempts: this.metrics.totalAttempts / 
        (this.metrics.validResponses + this.metrics.invalidResponses || 1),
    };
  }

  /**
   * Reset LLM response metrics
   */
  resetMetrics(): void {
    this.metrics.validationErrors = [];
    this.metrics.parseErrors = [];
    this.metrics.totalAttempts = 0;
    this.metrics.validResponses = 0;
    this.metrics.invalidResponses = 0;
    this.metrics.averageAttempts = 0;
  }

  /**
   * Generate an AI-powered learning recommendation for a skill gap
   * @param userId The user ID
   * @param skill The skill with a gap
   * @param score The user's current score
   * @param assessmentHistory Brief history of user's assessments
   * @returns A validated AI-generated recommendation DTO or null if AI is disabled or validation fails
   */
  async generateRecommendation(
    userId: string,
    skill: Skill,
    score: number,
    assessmentHistory: { skillId: string; isCorrect: boolean; date: Date }[],
  ): Promise<AiGeneratedRecommendationDto | null> {
    if (!this.isEnabled()) {
      this.logger.warn('Attempted to generate AI recommendation, but AI is disabled.');
      return null;
    }

    const llmProvider = this.llmFactory.getDefaultProvider();
    if (!llmProvider) {
      this.logger.error('Cannot generate AI recommendation: No enabled LLM provider found.');
      return null;
    }

    // Get feedback history for this user and skill
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
    } catch (error) {
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

  private _generateSystemPrompt(): string {
    return `You are an educational AI advisor that creates personalized learning recommendations for students based on their performance data and previous feedback on recommendations.`;
  }

  private _generatePrompt(
    userId: string,
    skill: Skill,
    score: number,
    assessmentHistory: { skillId: string; isCorrect: boolean; date: Date }[],
    feedbackInsights: {
      preferredTypes: RecommendationType[];
      avoidedTypes: RecommendationType[];
      difficultyPreference: 'easier' | 'harder' | 'appropriate';
      commonIssues: string[];
    },
  ): string {
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
        "resourceType": "${Object.values(RecommendationType).join('|')}",
        "resourceUrl": "URL to a relevant teaching resource (can be a popular educational site)",
        "priority": "${Object.values(RecommendationPriority).join('|')}"
      }
    `;
  }

  private async _parseResponse(response: string): Promise<any | null> {
    try {
      return JSON.parse(response);
    } catch (parseError) {
      this.logger.warn('Direct JSON parsing failed, attempting regex extraction...', parseError);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this._recordParseError('INVALID_JSON_FORMAT', 'Unable to extract JSON from response', response);
        return null;
      }

      try {
        return JSON.parse(jsonMatch[0]);
      } catch (regexParseError) {
        this._recordParseError('INVALID_JSON_CONTENT', 'Failed to parse extracted JSON', jsonMatch[0]);
        return null;
      }
    }
  }

  private async _validateResponse(parsedJson: any): Promise<AiGeneratedRecommendationDto | null> {
    if (!parsedJson) {
      this._recordValidationError('NULL_RESPONSE', 'Parsed JSON is null or undefined', [], null);
      return null;
    }

    const recommendationDto = plainToInstance(AiGeneratedRecommendationDto, parsedJson);
    const errors = await validate(recommendationDto);

    if (errors.length > 0) {
      this._recordValidationError('VALIDATION_FAILED', 'LLM response failed validation', errors, parsedJson);
      return null;
    }

    return recommendationDto;
  }

  private _recordValidationError(code: string, message: string, errors: ValidationError[], rawResponse: any): void {
    const error: LlmValidationError = { code, message, details: errors, rawResponse };
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

  private _recordParseError(code: string, message: string, response: string): void {
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

  private async _getFeedbackHistory(userId: string, skillId: string): Promise<RecommendationFeedback[]> {
    return this.feedbackRepository.find({
      where: {
        userId,
        recommendation: { skillId },
      },
      order: { createdAt: 'DESC' },
      take: 10, // Get last 10 feedback entries
    });
  }

  private _analyzeFeedbackHistory(feedbackHistory: RecommendationFeedback[]): {
    preferredTypes: RecommendationType[];
    avoidedTypes: RecommendationType[];
    difficultyPreference: 'easier' | 'harder' | 'appropriate';
    commonIssues: string[];
  } {
    const typeFeedback = new Map<RecommendationType, { helpful: number; notHelpful: number }>();
    let tooEasyCount = 0;
    let tooDifficultCount = 0;
    let appropriateCount = 0;
    const issues = new Map<string, number>();

    // Analyze each feedback entry
    feedbackHistory.forEach(feedback => {
      // Track resource type effectiveness
      const resourceType = feedback.metadata?.resourceType as RecommendationType;
      if (resourceType) {
        if (!typeFeedback.has(resourceType)) {
          typeFeedback.set(resourceType, { helpful: 0, notHelpful: 0 });
        }
        const stats = typeFeedback.get(resourceType)!;
        if (feedback.feedbackType === FeedbackType.HELPFUL) {
          stats.helpful++;
        } else if (feedback.feedbackType === FeedbackType.NOT_HELPFUL) {
          stats.notHelpful++;
        }
      }

      // Track difficulty preferences
      switch (feedback.feedbackType) {
        case FeedbackType.TOO_EASY:
          tooEasyCount++;
          break;
        case FeedbackType.TOO_DIFFICULT:
          tooDifficultCount++;
          break;
        case FeedbackType.HELPFUL:
          appropriateCount++;
          break;
      }

      // Track common issues from comments
      if (feedback.comment) {
        issues.set(feedback.comment, (issues.get(feedback.comment) || 0) + 1);
      }
    });

    // Determine preferred and avoided resource types
    const preferredTypes: RecommendationType[] = [];
    const avoidedTypes: RecommendationType[] = [];
    typeFeedback.forEach((stats, type) => {
      const totalFeedback = stats.helpful + stats.notHelpful;
      if (totalFeedback >= 2) { // Require at least 2 feedback entries
        const helpfulRate = stats.helpful / totalFeedback;
        if (helpfulRate >= 0.7) {
          preferredTypes.push(type);
        } else if (helpfulRate <= 0.3) {
          avoidedTypes.push(type);
        }
      }
    });

    // Determine difficulty preference
    let difficultyPreference: 'easier' | 'harder' | 'appropriate' = 'appropriate';
    const totalDifficultyFeedback = tooEasyCount + tooDifficultCount + appropriateCount;
    if (totalDifficultyFeedback > 0) {
      if (tooEasyCount / totalDifficultyFeedback > 0.5) {
        difficultyPreference = 'harder';
      } else if (tooDifficultCount / totalDifficultyFeedback > 0.5) {
        difficultyPreference = 'easier';
      }
    }

    // Get most common issues
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
} 