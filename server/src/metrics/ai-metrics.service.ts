import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../redis.service';
import { RecommendationFeedback, FeedbackType } from 'src/entities/recommendation_feedback.entity';
import { RecommendationType } from 'src/dto/recommendation.dto';

interface AiPerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  cacheHits: number;
  cacheMisses: number;
  errorsByType: Record<string, number>;
  recentErrors: Array<{
    code: string;
    message: string;
    timestamp: Date;
    userId: string;
    skillId: string;
    attempt: number;
    provider: string;
  }>;
  successRate?: number;
  cacheHitRate?: number;
  feedback?: {
    totalFeedback: number;
    feedbackByType: Record<FeedbackType, number>;
    resourceTypeEffectiveness: Record<RecommendationType, {
      total: number;
      helpful: number;
      notHelpful: number;
      effectiveness: number;
    }>;
    averageImpactScore: number;
    commonIssues: Array<{
      issue: string;
      count: number;
    }>;
  };
}

@Injectable()
export class AiMetricsService {
  private readonly logger = new Logger(AiMetricsService.name);
  private readonly METRICS_KEY = 'ai:metrics';
  private readonly MAX_RECENT_ERRORS = 100;
  private readonly MAX_COMMON_ISSUES = 10;
  private metrics: AiPerformanceMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errorsByType: {},
    recentErrors: [],
    feedback: {
      totalFeedback: 0,
      feedbackByType: {} as Record<FeedbackType, number>,
      resourceTypeEffectiveness: {} as Record<RecommendationType, {
        total: number;
        helpful: number;
        notHelpful: number;
        effectiveness: number;
      }>,
      averageImpactScore: 0,
      commonIssues: [],
    },
  };

  constructor(
    private readonly redisService: RedisService,
    @InjectRepository(RecommendationFeedback)
    private readonly feedbackRepository: Repository<RecommendationFeedback>,
  ) {
    this.loadMetrics();
    this.startPeriodicFeedbackAnalysis();
  }

  private async loadMetrics(): Promise<void> {
    if (!this.redisService.isEnabled()) {
      return;
    }

    try {
      const storedMetrics = await this.redisService.get(this.METRICS_KEY);
      if (storedMetrics) {
        this.metrics = JSON.parse(storedMetrics);
      }
      await this.updateFeedbackMetrics();
    } catch (error) {
      this.logger.error(`Failed to load metrics from Redis: ${error.message}`);
    }
  }

  private async saveMetrics(): Promise<void> {
    if (!this.redisService.isEnabled()) {
      return;
    }

    try {
      await this.redisService.set(this.METRICS_KEY, JSON.stringify(this.metrics));
    } catch (error) {
      this.logger.error(`Failed to save metrics to Redis: ${error.message}`);
    }
  }

  private startPeriodicFeedbackAnalysis(): void {
    // Update feedback metrics every hour
    setInterval(async () => {
      await this.updateFeedbackMetrics();
    }, 60 * 60 * 1000);
  }

  private async updateFeedbackMetrics(): Promise<void> {
    try {
      const feedback = await this.feedbackRepository.find({
        order: { createdAt: 'DESC' },
      });

      const metrics = this.metrics.feedback!;
      metrics.totalFeedback = feedback.length;

      // Reset metrics
      metrics.feedbackByType = {} as Record<FeedbackType, number>;
      metrics.resourceTypeEffectiveness = {} as Record<RecommendationType, {
        total: number;
        helpful: number;
        notHelpful: number;
        effectiveness: number;
      }>;
      metrics.commonIssues = [];

      let totalImpactScore = 0;
      let impactScoreCount = 0;
      const issues = new Map<string, number>();

      feedback.forEach(item => {
        // Count by feedback type
        metrics.feedbackByType[item.feedbackType] = (metrics.feedbackByType[item.feedbackType] || 0) + 1;

        // Track resource type effectiveness
        const resourceType = item.metadata?.resourceType as RecommendationType;
        if (resourceType) {
          if (!metrics.resourceTypeEffectiveness[resourceType]) {
            metrics.resourceTypeEffectiveness[resourceType] = {
              total: 0,
              helpful: 0,
              notHelpful: 0,
              effectiveness: 0,
            };
          }

          const stats = metrics.resourceTypeEffectiveness[resourceType];
          stats.total++;

          if (item.feedbackType === FeedbackType.HELPFUL) {
            stats.helpful++;
          } else if (item.feedbackType === FeedbackType.NOT_HELPFUL) {
            stats.notHelpful++;
          }

          stats.effectiveness = stats.total > 0 ? (stats.helpful / stats.total) * 100 : 0;
        }

        // Track impact scores
        if (item.impactScore !== null && item.impactScore !== undefined) {
          totalImpactScore += item.impactScore;
          impactScoreCount++;
        }

        // Track common issues from comments
        if (item.comment) {
          issues.set(item.comment, (issues.get(item.comment) || 0) + 1);
        }
      });

      // Calculate average impact score
      metrics.averageImpactScore = impactScoreCount > 0 ? totalImpactScore / impactScoreCount : 0;

      // Sort and limit common issues
      metrics.commonIssues = Array.from(issues.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, this.MAX_COMMON_ISSUES)
        .map(([issue, count]) => ({ issue, count }));

      await this.saveMetrics();
    } catch (error) {
      this.logger.error(`Failed to update feedback metrics: ${error.message}`);
    }
  }

  async recordRequest(
    success: boolean,
    responseTime: number,
    fromCache: boolean,
    error?: { code: string; message: string; userId: string; skillId: string; attempt: number; provider: string },
  ): Promise<void> {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
      
      if (error) {
        // Update error counts by type
        this.metrics.errorsByType[error.code] = (this.metrics.errorsByType[error.code] || 0) + 1;
        
        // Add to recent errors
        this.metrics.recentErrors.unshift({
          ...error,
          timestamp: new Date(),
        });
        
        // Keep only the most recent errors
        if (this.metrics.recentErrors.length > this.MAX_RECENT_ERRORS) {
          this.metrics.recentErrors.pop();
        }
      }
    }

    // Update cache metrics
    if (fromCache) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }

    // Update average response time
    const totalResponses = this.metrics.successfulRequests + this.metrics.failedRequests;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (totalResponses - 1) + responseTime) / totalResponses;

    await this.saveMetrics();
  }

  async getMetrics(): Promise<AiPerformanceMetrics> {
    // Ensure feedback metrics are up to date
    await this.updateFeedbackMetrics();

    return {
      ...this.metrics,
      // Calculate derived metrics
      successRate: this.metrics.totalRequests > 0 
        ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 
        : 0,
      cacheHitRate: (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
        ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100
        : 0,
    };
  }

  async resetMetrics(): Promise<void> {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errorsByType: {},
      recentErrors: [],
      feedback: {
        totalFeedback: 0,
        feedbackByType: {} as Record<FeedbackType, number>,
        resourceTypeEffectiveness: {} as Record<RecommendationType, {
          total: number;
          helpful: number;
          notHelpful: number;
          effectiveness: number;
        }>,
        averageImpactScore: 0,
        commonIssues: [],
      },
    };
    await this.saveMetrics();
  }
} 