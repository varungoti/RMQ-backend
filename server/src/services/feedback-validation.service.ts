import { Injectable, Logger } from '@nestjs/common';
import { CreateRecommendationFeedbackDto } from 'src/dto/recommendation-feedback.dto';
import { FeedbackType } from 'src/entities/recommendation_feedback.entity';
import { RecommendationType } from 'src/dto/recommendation.dto';
import { WordTokenizer, TfIdf, PorterStemmer, SentimentAnalyzer } from './natural-compat';

// Create compatibility variables
const natural = { WordTokenizer, TfIdf, PorterStemmer, SentimentAnalyzer };

/**
 * Represents the priority score and its contributing factors for a piece of feedback.
 * The priority score helps determine how quickly feedback should be addressed.
 * 
 * @property score - Overall priority score between 0 and 1
 * @property factors - Individual factors contributing to the priority score
 *   - sentiment: How strong the sentiment is (positive or negative)
 *   - impact: How impactful the feedback is (based on impact score)
 *   - urgency: Presence of urgent keywords in the feedback
 *   - userEngagement: User's engagement level with the content
 */
interface PriorityScore {
  score: number;
  factors: {
    sentiment: number;
    impact: number;
    urgency: number;
    userEngagement: number;
  };
}

/**
 * Service responsible for validating and analyzing feedback.
 * Provides functionality for:
 * - Input validation and sanitization
 * - Sentiment analysis
 * - Quality scoring
 * - Priority scoring
 * - XSS prevention
 */
@Injectable()
export class FeedbackValidationService {
  private readonly logger = new Logger(FeedbackValidationService.name);
  private readonly COMMENT_MAX_LENGTH = 1000;
  private readonly COMMENT_BLACKLIST = [
    'script',
    'javascript',
    'eval(',
    'onload',
    'onerror',
    '<',
    '>',
  ];
  private readonly tokenizer = new natural.WordTokenizer();
  private readonly sentimentAnalyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
  
  /**
   * Keywords that indicate urgency in feedback comments.
   * Used to calculate the urgency factor in priority scoring.
   */
  private readonly urgencyKeywords = new Set([
    'urgent', 'critical', 'important', 'asap', 'immediately',
    'broken', 'error', 'issue', 'problem', 'bug'
  ]);

  /**
   * Validates and sanitizes feedback data, performing sentiment analysis and priority scoring.
   * 
   * @param feedback - The feedback data to validate and analyze
   * @returns Object containing:
   *   - isValid: Whether the feedback is valid
   *   - sanitized: Sanitized feedback data
   *   - issues: Array of validation issues found
   *   - sentiment: Sentiment analysis results
   *   - priority: Priority scoring results
   */
  validateAndSanitize(feedback: CreateRecommendationFeedbackDto): {
    isValid: boolean;
    sanitized: CreateRecommendationFeedbackDto;
    issues: string[];
    sentiment?: { score: number; comparative: number };
    priority?: PriorityScore;
  } {
    const issues: string[] = [];
    const sanitized = { ...feedback };
    let sentiment: { score: number; comparative: number } | undefined;

    // Validate and sanitize comment
    if (feedback.comment) {
      if (feedback.comment.length > this.COMMENT_MAX_LENGTH) {
        issues.push(`Comment exceeds maximum length of ${this.COMMENT_MAX_LENGTH} characters`);
        sanitized.comment = feedback.comment.substring(0, this.COMMENT_MAX_LENGTH);
      }

      // Check for potential XSS/injection attempts
      if (this.COMMENT_BLACKLIST.some(term => feedback.comment.toLowerCase().includes(term))) {
        issues.push('Comment contains potentially unsafe content');
        sanitized.comment = this.sanitizeComment(feedback.comment);
      }

      // Perform sentiment analysis
      sentiment = this.analyzeSentiment(sanitized.comment);
    }

    // Validate impact score
    if (feedback.impactScore !== undefined) {
      if (feedback.impactScore < 0 || feedback.impactScore > 100) {
        issues.push('Impact score must be between 0 and 100');
        sanitized.impactScore = Math.max(0, Math.min(100, feedback.impactScore));
      }
    }

    // Validate metadata
    if (feedback.metadata) {
      try {
        // Ensure metadata is a valid object
        const sanitizedMetadata = this.sanitizeMetadata(feedback.metadata);
        sanitized.metadata = sanitizedMetadata;
      } catch (error) {
        issues.push('Invalid metadata format');
        sanitized.metadata = {};
      }
    }

    // Validate feedback type consistency
    if (feedback.feedbackType === FeedbackType.HELPFUL && feedback.impactScore !== undefined && feedback.impactScore < 50) {
      issues.push('Inconsistent feedback: HELPFUL feedback with low impact score');
    }

    if (feedback.feedbackType === FeedbackType.NOT_HELPFUL && feedback.impactScore !== undefined && feedback.impactScore > 50) {
      issues.push('Inconsistent feedback: NOT_HELPFUL feedback with high impact score');
    }

    // Calculate feedback quality score
    const qualityScore = this.calculateQualityScore(sanitized, sentiment);

    // Calculate priority score
    const priority = this.calculatePriorityScore(sanitized, sentiment);

    sanitized.metadata = {
      ...sanitized.metadata,
      priority,
      qualityScore,
      sentiment,
    };

    return {
      isValid: issues.length === 0,
      sanitized,
      issues,
      sentiment,
      priority,
    };
  }

  /**
   * Analyzes sentiment of feedback comment
   */
  private analyzeSentiment(comment: string): { score: number; comparative: number } {
    const tokens = this.tokenizer.tokenize(comment);
    const score = this.sentimentAnalyzer.getSentiment(tokens);
    const comparative = score / tokens.length;
    return { score, comparative };
  }

  /**
   * Calculates a quality score for the feedback based on various factors
   */
  private calculateQualityScore(
    feedback: CreateRecommendationFeedbackDto,
    sentiment?: { score: number; comparative: number }
  ): number {
    let score = 0;

    // Factor 1: Presence of detailed comment
    if (feedback.comment && feedback.comment.length > 20) {
      score += 0.2;
    }

    // Factor 2: Impact score provided
    if (feedback.impactScore !== undefined) {
      score += 0.2;
    }

    // Factor 3: Metadata completeness
    if (feedback.metadata && Object.keys(feedback.metadata).length > 0) {
      score += 0.2;
    }

    // Factor 4: Consistency between feedback type and impact score
    if (feedback.impactScore !== undefined) {
      const isConsistent = (feedback.feedbackType === FeedbackType.HELPFUL && feedback.impactScore > 50) ||
                          (feedback.feedbackType === FeedbackType.NOT_HELPFUL && feedback.impactScore < 50);
      if (isConsistent) {
        score += 0.2;
      }
    }

    // Factor 5: Sentiment analysis consistency
    if (sentiment) {
      const sentimentConsistent = 
        (feedback.feedbackType === FeedbackType.HELPFUL && sentiment.comparative > 0) ||
        (feedback.feedbackType === FeedbackType.NOT_HELPFUL && sentiment.comparative < 0);
      if (sentimentConsistent) {
        score += 0.2;
      }
    }

    return Math.min(1, score);
  }

  /**
   * Calculates priority score for feedback based on multiple factors.
   * The priority score helps determine how quickly feedback should be addressed.
   * 
   * Factors considered:
   * 1. Sentiment (30%): How strong the sentiment is (positive or negative)
   * 2. Impact (30%): How impactful the feedback is (based on impact score)
   * 3. Urgency (20%): Presence of urgent keywords in the feedback
   * 4. User Engagement (20%): User's engagement level with the content
   * 
   * Each factor is normalized to a value between 0 and 1.
   * The final score is a weighted average of all factors.
   * 
   * @param feedback - The feedback data to analyze
   * @param sentiment - Optional sentiment analysis results
   * @returns Priority score and contributing factors
   */
  private calculatePriorityScore(
    feedback: CreateRecommendationFeedbackDto,
    sentiment?: { score: number; comparative: number }
  ): PriorityScore {
    const factors = {
      sentiment: 0,
      impact: 0,
      urgency: 0,
      userEngagement: 0
    };

    // Sentiment factor (0-1)
    if (sentiment) {
      factors.sentiment = Math.abs(sentiment.comparative);
    }

    // Impact factor (0-1)
    if (feedback.impactScore !== undefined) {
      factors.impact = feedback.impactScore / 100;
    }

    // Urgency factor (0-1)
    if (feedback.comment) {
      const words = this.tokenizer.tokenize(feedback.comment.toLowerCase());
      const urgencyCount = words.filter(word => this.urgencyKeywords.has(word)).length;
      factors.urgency = Math.min(1, urgencyCount / 3); // Cap at 1 for 3+ urgency words
    }

    // User engagement factor (0-1)
    if (feedback.metadata?.userEngagement) {
      factors.userEngagement = Math.min(1, feedback.metadata.userEngagement / 100);
    }

    // Calculate weighted score
    const score = (
      factors.sentiment * 0.3 +
      factors.impact * 0.3 +
      factors.urgency * 0.2 +
      factors.userEngagement * 0.2
    );

    return { score, factors };
  }

  /**
   * Sanitizes user comments to prevent XSS and other injection attacks
   */
  private sanitizeComment(comment: string): string {
    let sanitized = comment;
    
    // Remove potential HTML/script tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    
    // Remove potential script injection attempts
    this.COMMENT_BLACKLIST.forEach(term => {
      sanitized = sanitized.replace(new RegExp(term, 'gi'), '[REMOVED]');
    });
    
    // Remove excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    return sanitized;
  }

  /**
   * Sanitizes metadata to ensure it only contains safe data
   */
  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(metadata)) {
      // Only allow certain types of values
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        value === null
      ) {
        sanitized[key] = value;
      } else if (Array.isArray(value)) {
        // For arrays, only allow primitive values
        sanitized[key] = value.filter(item =>
          typeof item === 'string' ||
          typeof item === 'number' ||
          typeof item === 'boolean'
        );
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeMetadata(value);
      }
    }

    return sanitized;
  }
} 