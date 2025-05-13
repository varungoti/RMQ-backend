import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
  ForbiddenException,
  ParseBoolPipe,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  HttpCode,
  HttpStatus,
  Put,
  Delete,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from './entities/user.entity';
import { RecommendationsService } from './recommendations.service';
import { 
  RecommendationDto,
  RecommendationSetDto,
  RecommendationQueryDto,
  RecommendationType,
  RecommendationResourceDto,
  MarkCompletedRequestDto,
  CreateResourceRequestDto,
  SkillGapExplanationRequestDto,
  SkillGapExplanationResponseDto,
  RecommendationHistoryItemDto,
} from './dto/recommendation.dto';
import { CreateRecommendationFeedbackDto, RecommendationFeedbackResponseDto } from './dto/recommendation-feedback.dto';
import { LlmFactoryService } from './llm/llm-factory.service';
import { LlmProviderType } from './dto/llm-provider.dto';
import { IsEnum, IsNumber, IsOptional, IsString, IsUrl, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Skill } from './entities/skill.entity';
import { RecommendationHistory } from './entities/recommendation_history.entity';
import { AiRecommendationService } from './ai-recommendation.service';
import { AiMetricsService } from './metrics/ai-metrics.service';

interface CreateResourceRequest {
  title: string;
  description: string;
  url: string;
  type: RecommendationType;
  estimatedTimeMinutes: number;
  gradeLevel: number;
  tags?: string[];
  skillIds: string[];
}

interface MarkCompletedRequest {
  wasHelpful: boolean;
}

interface LlmInfoResponse {
  defaultProvider: LlmProviderType;
  availableProviders: {
    type: LlmProviderType;
    enabled: boolean;
    model: string;
  }[];
}

interface SelectLlmRequest {
  provider: LlmProviderType;
}

interface SkillGapExplanationRequest {
  skillId: string;
  score: number;
  userId?: string;
}

interface UpdateLlmConfigRequest {
  provider: LlmProviderType;
  model?: string;
  temperature?: number;
  apiKey?: string;
  enabled?: boolean;
  endpoint?: string;
}

class SimpleSuccessResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional()
  message?: string;
}

class LlmInfoProviderDto {
  @ApiProperty({ enum: LlmProviderType, description: 'LLM Provider Type' })
  type: LlmProviderType;

  @ApiProperty({ description: 'Whether the provider is currently enabled' })
  enabled: boolean;

  @ApiProperty({ description: 'Model used by this provider', example: 'gpt-3.5-turbo' })
  model: string;
}

class LlmInfoResponseDto {
  @ApiProperty({ enum: LlmProviderType, description: 'The currently selected default LLM provider' })
  defaultProvider: LlmProviderType;

  @ApiProperty({ type: [LlmInfoProviderDto], description: 'List of all available providers and their status' })
  availableProviders: LlmInfoProviderDto[];
}

class SelectLlmRequestDto {
  @ApiProperty({ enum: LlmProviderType, description: 'The LLM provider to select as default' })
  @IsEnum(LlmProviderType)
  provider: LlmProviderType;
}

class CacheStatsMetricsDto {
    @ApiProperty()
    hits: number;
    @ApiProperty()
    misses: number;
    @ApiProperty()
    hitRate: number;
    @ApiProperty()
    evictions: number;
}

class CacheStatsResponseDto {
  @ApiProperty()
  enabled: boolean;
  @ApiProperty()
  size: number;
  @ApiProperty()
  maxSize: number;
  @ApiProperty()
  ttlSeconds: number;
  @ApiProperty({ type: CacheStatsMetricsDto })
  metrics: CacheStatsMetricsDto;
}

class UpdateLlmConfigRequestDto {
  @ApiProperty({ enum: LlmProviderType, description: 'The provider to configure' })
  @IsEnum(LlmProviderType)
  provider: LlmProviderType;

  @ApiPropertyOptional({ description: 'New model name' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ description: 'New temperature setting' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  temperature?: number;

  @ApiPropertyOptional({ description: 'New API key (sensitive)' })
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'Enable/disable the provider' })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'New endpoint URL (for self-hosted/custom providers)' })
  @IsUrl()
  @IsOptional()
  endpoint?: string;
}

class UpdateConfigResponseCacheDto {
    @ApiProperty()
    invalidated: boolean;
}

class UpdateConfigResponseDto {
    @ApiProperty()
    success: boolean;
    @ApiProperty()
    message: string;
    @ApiProperty({ type: UpdateConfigResponseCacheDto })
    cache: UpdateConfigResponseCacheDto;
}

class AiErrorMetricsDto {
  @ApiProperty({ description: 'Total number of failed requests' })
  totalErrors: number;

  @ApiProperty({ description: 'Count of errors by error type' })
  errorsByType: { [key: string]: number };

  @ApiProperty({ description: 'List of recent errors with details', type: [Object] })
  recentErrors: Array<{
    code: string;
    message: string;
    timestamp: Date;
    userId: string;
    skillId: string;
    attempt: number;
    provider: string;
  }>;
}

class AiMetricsResponseDto {
  @ApiProperty({ description: 'Total number of AI recommendation requests' })
  totalRequests: number;

  @ApiProperty({ description: 'Percentage of successful AI recommendations' })
  successRate: number;

  @ApiProperty({ description: 'Percentage of cache hits' })
  cacheHitRate: number;

  @ApiProperty({ description: 'Average response time in milliseconds' })
  averageResponseTime: number;

  @ApiProperty({ description: 'Detailed error metrics', type: AiErrorMetricsDto })
  errorMetrics: AiErrorMetricsDto;
}

class LlmValidationErrorDto {
  @ApiProperty({ description: 'Error code' })
  code: string;

  @ApiProperty({ description: 'Error message' })
  message: string;

  @ApiProperty({ description: 'Validation error details', type: [Object] })
  details: any[];

  @ApiProperty({ description: 'Raw response that failed validation' })
  rawResponse: any;
}

class LlmParseErrorDto {
  @ApiProperty({ description: 'Error code' })
  code: string;

  @ApiProperty({ description: 'Error message' })
  message: string;

  @ApiProperty({ description: 'Response that failed parsing' })
  response: string;
}

class LlmMetricsResponseDto {
  @ApiProperty({ description: 'Total number of LLM requests' })
  totalAttempts: number;

  @ApiProperty({ description: 'Number of valid responses' })
  validResponses: number;

  @ApiProperty({ description: 'Number of invalid responses' })
  invalidResponses: number;

  @ApiProperty({ description: 'Average attempts per request' })
  averageAttempts: number;

  @ApiProperty({ description: 'Recent validation errors', type: [LlmValidationErrorDto] })
  validationErrors: LlmValidationErrorDto[];

  @ApiProperty({ description: 'Recent parse errors', type: [LlmParseErrorDto] })
  parseErrors: LlmParseErrorDto[];
}

@ApiTags('Recommendations')
@ApiBearerAuth()
@Controller('recommendations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecommendationsController {
  private readonly logger = new Logger(RecommendationsController.name);

  constructor(
    private readonly recommendationsService: RecommendationsService,
    private readonly llmFactory: LlmFactoryService,
    private readonly aiRecommendationService: AiRecommendationService,
    private readonly aiMetrics: AiMetricsService,
  ) {}

  /**
   * Get personalized recommendations for the authenticated user
   */
  @Get()
  @ApiOperation({ summary: 'Get personalized recommendations' })
  @ApiQuery({ name: 'userId', required: false, description: 'Target User ID (Admin/Teacher only)', type: String, format: 'uuid' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max number of recommendations', type: Number, example: 5 })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by recommendation type', enum: RecommendationType })
  @ApiQuery({ name: 'skillId', required: false, description: 'Filter by specific skill ID', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Returns personalized recommendations', type: RecommendationSetDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access other user\'s recommendations' })
  async getRecommendations(
    @Req() req: any,
    @Query() queryParams: RecommendationQueryDto,
  ): Promise<RecommendationSetDto> {
    this.logger.log(`User ${req.user.userId} requesting recommendations with query: ${JSON.stringify(queryParams)}`);
    if (queryParams.userId && queryParams.userId !== req.user.userId) {
      if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.TEACHER) {
        throw new ForbiddenException('Only administrators or teachers can access other users\' recommendations');
      }
    }
    const userId = queryParams.userId || req.user.userId;
    return this.recommendationsService.getRecommendations(userId, queryParams);
  }

  /**
   * Mark a recommendation as completed
   */
  @Post('history/:recommendationId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a recommendation as completed' })
  @ApiParam({ name: 'recommendationId', description: 'Recommendation ID (UUID)', type: String })
  @ApiBody({ type: MarkCompletedRequestDto })
  @ApiResponse({ status: 200, description: 'Recommendation marked as completed', type: SimpleSuccessResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Recommendation not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async markRecommendationCompleted(
    @Req() req: any,
    @Param('recommendationId', ParseUUIDPipe) recommendationId: string,
    @Body() body: MarkCompletedRequestDto,
  ): Promise<SimpleSuccessResponseDto> {
    this.logger.log(`User ${req.user.userId} marking recommendation ${recommendationId} as complete.`);
    try {
      await this.recommendationsService.markRecommendationCompleted(req.user.userId, recommendationId, body.wasHelpful);
      return { success: true, message: 'Recommendation marked as completed successfully.' };
    } catch (error) {
        if (error instanceof NotFoundException) {
            throw new NotFoundException(error.message);
        } else if (error instanceof ForbiddenException) {
            throw new ForbiddenException(error.message);
        }
        this.logger.error(`Failed to mark recommendation ${recommendationId} complete for user ${req.user.userId}`, error.stack);
        throw new InternalServerErrorException('Failed to mark recommendation as completed.');
    }
  }

  /**
   * Get the recommendation history for the authenticated user
   */
  @Get('history')
  @ApiOperation({ summary: 'Get recommendation history' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit number of results', type: Number })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset results', type: Number })
  @ApiQuery({ name: 'skillId', required: false, description: 'Filter by skill ID', type: String, format: 'uuid' })
  @ApiQuery({ name: 'completed', required: false, description: 'Filter by completion status', type: Boolean })
  @ApiResponse({ status: 200, description: 'Returns recommendation history', type: [RecommendationHistoryItemDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRecommendationHistory(
    @Req() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('skillId') skillId?: string,
    @Query('completed', new ParseBoolPipe({ optional: true })) completed?: boolean,
  ): Promise<RecommendationHistoryItemDto[]> {
    this.logger.log(`User ${req.user.userId} requesting recommendation history with filters: limit=${limit}, offset=${offset}, skillId=${skillId}, completed=${completed}`);
    return this.recommendationsService.getUserRecommendationHistory(req.user.userId, limit, offset, skillId, completed);
  }

  /**
   * Get available recommendation resources (content library)
   */
  @Get('resources')
  @ApiOperation({ summary: 'Get available recommendation resources' })
  @ApiQuery({ name: 'skillId', required: false, description: 'Filter by associated skill ID (Not currently implemented in service)', type: String, format: 'uuid' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by resource type', enum: RecommendationType })
  @ApiQuery({ name: 'gradeLevel', required: false, description: 'Filter by grade level', type: Number })
  @ApiResponse({ status: 200, description: 'Returns available recommendation resources', type: [RecommendationResourceDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRecommendationResources(
    @Query('skillId') skillId?: string,
    @Query('type') type?: RecommendationType,
    @Query('gradeLevel') gradeLevel?: number,
  ): Promise<RecommendationResourceDto[]> {
    this.logger.log(`Fetching recommendation resources (skillId: ${skillId}, type: ${type}, gradeLevel: ${gradeLevel})`);
    return this.recommendationsService.getRecommendationResources(type, gradeLevel);
  }

  /**
   * Create a new recommendation resource (Admin only)
   */
  @Post('resources')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new recommendation resource (Admin only)' })
  @ApiBody({ type: CreateResourceRequestDto })
  @ApiResponse({ status: 201, description: 'Resource created successfully', type: RecommendationResourceDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createRecommendationResource(
    @Req() req: any,
    @Body(ValidationPipe) createDto: CreateResourceRequestDto,
  ): Promise<RecommendationResourceDto> {
    this.logger.log(`Admin ${req.user.userId} creating new recommendation resource: ${createDto.title}`);
    return this.recommendationsService.createRecommendationResource(createDto);
  }

  /**
   * Get information about available LLM providers
   */
  @Get('llm/info')
  @ApiOperation({ summary: 'Get information about configured LLM providers' })
  @ApiResponse({ status: 200, description: 'LLM configuration details', type: LlmInfoResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLlmInfo(): Promise<LlmInfoResponseDto> {
    this.logger.log(`Fetching LLM info.`);
    const defaultProviderType = this.llmFactory.getDefaultProvider().getConfig().type;
    const availableProviders: LlmInfoProviderDto[] = [];
    const allProvidersMap = this.llmFactory.getAllProviders();
    allProvidersMap.forEach((providerService, providerType) => {
        availableProviders.push({
          type: providerType,
          enabled: providerService.isEnabled(),
          model: providerService.getConfig().model || 'N/A',
        });
    });

    return { defaultProvider: defaultProviderType, availableProviders };
  }

  /**
   * Admin endpoint to select a different LLM provider
   */
  @Post('llm/select')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Select the default LLM provider (Admin only)' })
  @ApiBody({ type: SelectLlmRequestDto })
  @ApiResponse({ status: 200, description: 'Default LLM provider updated', type: SimpleSuccessResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid provider specified' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async selectLlmProvider(
    @Req() req: any,
    @Body(ValidationPipe) body: SelectLlmRequestDto,
  ): Promise<SimpleSuccessResponseDto> {
    this.logger.log(`Admin ${req.user.userId} selecting LLM provider: ${body.provider}`);
    try {
        const success = this.llmFactory.setDefaultProvider(body.provider);
        if (success) {
            return { success: true, message: `Default LLM provider set to ${body.provider}` };
        } else {
            throw new BadRequestException(`Provider ${body.provider} not found or could not be set.`);
        }
    } catch (error) {
        this.logger.error(`Failed to set LLM provider to ${body.provider}`, error.stack);
         if (error instanceof BadRequestException) {
            throw error;
        }
        throw new InternalServerErrorException('Failed to update LLM provider.');
    }
  }

  /**
   * Get information about the LLM cache
   */
  @Get('llm/cache/stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get LLM cache statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'LLM cache statistics', type: CacheStatsResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getLlmCacheStats(): Promise<CacheStatsResponseDto> {
      this.logger.log(`Fetching LLM cache stats.`);
      const stats = await this.llmFactory.getCacheStats();
      return {
          enabled: stats.enabled,
          size: stats.size,
          maxSize: stats.maxSize,
          ttlSeconds: stats.ttlSeconds,
          metrics: {
              hits: stats.metrics.hits,
              misses: stats.metrics.misses,
              hitRate: stats.metrics.hitRate,
              evictions: stats.metrics.evictions,
          }
      };
  }

  /**
   * Clear the LLM cache
   */
  @Post('llm/cache/clear')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Clear the LLM cache (Admin only)' })
  @ApiResponse({ status: 200, description: 'LLM cache cleared', type: SimpleSuccessResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async clearLlmCache(): Promise<SimpleSuccessResponseDto> {
    this.logger.log(`Clearing LLM cache.`);
    this.llmFactory.clearCache();
    return { success: true, message: 'LLM cache cleared successfully.' };
  }

  /**
   * Reset the LLM cache metrics
   */
  @Post('llm/cache/metrics/reset')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reset LLM cache metrics (Admin only)' })
  @ApiResponse({ status: 200, description: 'LLM cache metrics reset', type: SimpleSuccessResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async resetLlmCacheMetrics(): Promise<SimpleSuccessResponseDto> {
    this.logger.log(`Resetting LLM cache metrics.`);
    this.llmFactory.resetCacheMetrics();
    return { success: true, message: 'LLM cache metrics reset successfully.' };
  }

  /**
   * Update LLM provider configuration
   */
  @Put('llm/config')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update LLM provider configuration (Admin only)' })
  @ApiBody({ type: UpdateLlmConfigRequestDto })
  @ApiResponse({ status: 200, description: 'LLM configuration updated', type: UpdateConfigResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid configuration' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateLlmConfig(
    @Body(ValidationPipe) body: UpdateLlmConfigRequestDto,
  ): Promise<UpdateConfigResponseDto> {
    this.logger.log(`Updating LLM config for provider: ${body.provider}`);
    try {
        const cacheInvalidated = this.llmFactory.updateProviderConfig(body.provider, {
            model: body.model,
            temperature: body.temperature,
            apiKey: body.apiKey,
            enabled: body.enabled,
            endpoint: body.endpoint,
        });
        return {
            success: true,
            message: `Configuration for ${body.provider} updated successfully.`,
            cache: { invalidated: cacheInvalidated }
        };
    } catch (error) {
        this.logger.error(`Failed to update LLM config for ${body.provider}`, error.stack);
         if (error instanceof BadRequestException) {
            throw error;
        }
        throw new InternalServerErrorException('Failed to update LLM configuration.');
    }
  }

  /**
   * Get AI explanation for a skill gap for the authenticated user
   */
  @Get('ai/explain/:skillId')
  @ApiOperation({ summary: 'Get AI explanation for a skill gap' })
  @ApiParam({ name: 'skillId', description: 'Skill ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'Returns AI-generated explanation for the skill gap', type: SkillGapExplanationResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Skill or user score not found' })
  @ApiResponse({ status: 500, description: 'AI generation failed' })
  async getAiSkillGapExplanation(
    @Req() req: any,
    @Param('skillId', ParseUUIDPipe) skillId: string
  ): Promise<SkillGapExplanationResponseDto | null> {
      this.logger.log(`User ${req.user.userId} requesting AI explanation for skill gap: ${skillId}`);
      try {
          const explanationResult = await this.recommendationsService.getAiSkillGapExplanation(req.user.userId, skillId);
          if (!explanationResult) {
             this.logger.warn(`No explanation generated for user ${req.user.userId}, skill ${skillId}.`);
             return null;
          }
          // Explicitly create an instance of the DTO
          const responseDto = new SkillGapExplanationResponseDto();
          // Assign the explanation string directly
          responseDto.explanation = explanationResult;
          return responseDto;
      } catch (error) {
          if (error instanceof NotFoundException) {
              throw new NotFoundException(error.message);
          }
          this.logger.error(`Failed to get AI explanation for user ${req.user.userId}, skill ${skillId}`, error.stack);
          throw new InternalServerErrorException('Failed to generate AI explanation.');
      }
  }

  @Get('/metrics/ai')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get AI recommendation metrics' })
  @ApiResponse({ status: 200, type: AiMetricsResponseDto })
  async getAiMetrics(): Promise<AiMetricsResponseDto> {
    const metrics = await this.aiMetrics.getMetrics();
    return {
      totalRequests: metrics.totalRequests,
      successRate: metrics.successRate || 0,
      cacheHitRate: metrics.cacheHitRate || 0,
      averageResponseTime: metrics.averageResponseTime,
      errorMetrics: {
        totalErrors: metrics.failedRequests,
        errorsByType: metrics.errorsByType,
        recentErrors: metrics.recentErrors.map(error => ({
          code: error.code,
          message: error.message,
          timestamp: error.timestamp,
          userId: error.userId,
          skillId: error.skillId,
          attempt: error.attempt,
          provider: error.provider,
        })),
      },
    };
  }

  @Post('/metrics/ai/reset')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reset AI metrics' })
  @ApiResponse({ status: 200, type: SimpleSuccessResponseDto })
  async resetAiMetrics(): Promise<SimpleSuccessResponseDto> {
    await this.aiMetrics.resetMetrics();
    return { success: true, message: 'AI metrics reset successfully' };
  }

  @Get('metrics/llm')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get LLM response metrics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns metrics about LLM response generation',
    type: LlmMetricsResponseDto,
  })
  async getLlmMetrics(): Promise<LlmMetricsResponseDto> {
    return this.aiRecommendationService.getMetrics();
  }

  @Post('metrics/llm/reset')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reset LLM response metrics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'LLM metrics have been reset',
    type: SimpleSuccessResponseDto,
  })
  async resetLlmMetrics(): Promise<SimpleSuccessResponseDto> {
    this.aiRecommendationService.resetMetrics();
    return { success: true, message: 'LLM metrics have been reset' };
  }

  /**
   * Add feedback for a recommendation
   */
  @Post(':recommendationId/feedback')
  @ApiOperation({ summary: 'Add feedback for a recommendation' })
  @ApiParam({ name: 'recommendationId', description: 'Recommendation ID (UUID)', type: String })
  @ApiBody({ type: CreateRecommendationFeedbackDto })
  @ApiResponse({ status: 201, description: 'Feedback added successfully', type: RecommendationFeedbackResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Recommendation not found' })
  async addRecommendationFeedback(
    @Req() req: any,
    @Param('recommendationId', ParseUUIDPipe) recommendationId: string,
    @Body(ValidationPipe) feedbackDto: CreateRecommendationFeedbackDto,
  ): Promise<RecommendationFeedbackResponseDto> {
    this.logger.log(`User ${req.user.userId} adding feedback for recommendation ${recommendationId}`);
    const feedback = await this.recommendationsService.addRecommendationFeedback(
      req.user.userId,
      recommendationId,
      feedbackDto,
    );
    return feedback;
  }

  /**
   * Get feedback for a recommendation
   */
  @Get(':recommendationId/feedback')
  @ApiOperation({ summary: 'Get feedback for a recommendation' })
  @ApiParam({ name: 'recommendationId', description: 'Recommendation ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: 'Returns feedback for the recommendation', type: [RecommendationFeedbackResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Recommendation not found' })
  async getRecommendationFeedback(
    @Req() req: any,
    @Param('recommendationId', ParseUUIDPipe) recommendationId: string,
  ): Promise<RecommendationFeedbackResponseDto[]> {
    this.logger.log(`User ${req.user.userId} requesting feedback for recommendation ${recommendationId}`);
    return this.recommendationsService.getRecommendationFeedback(req.user.userId, recommendationId);
  }

  /**
   * Get feedback statistics for the authenticated user
   */
  @Get('feedback/stats')
  @ApiOperation({ summary: 'Get feedback statistics for user recommendations' })
  @ApiResponse({ status: 200, description: 'Returns feedback statistics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserFeedbackStats(
    @Req() req: any,
  ): Promise<{
    totalFeedback: number;
    feedbackByType: Record<string, number>;
    averageImpactScore: number;
  }> {
    this.logger.log(`User ${req.user.userId} requesting feedback statistics`);
    return this.recommendationsService.getUserFeedbackStats(req.user.userId);
  }
} 