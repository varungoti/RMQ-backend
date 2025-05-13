import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackValidationService } from './feedback-validation.service';
import { CreateRecommendationFeedbackDto } from 'src/dto/recommendation-feedback.dto';
import { FeedbackType, FeedbackSource } from 'src/entities/recommendation_feedback.entity';
import { RecommendationType } from 'src/dto/recommendation.dto';

describe('FeedbackValidationService', () => {
  let service: FeedbackValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeedbackValidationService],
    }).compile();

    service = module.get<FeedbackValidationService>(FeedbackValidationService);
  });

  describe('validateAndSanitize', () => {
    it('should validate valid feedback without issues', () => {
      const feedback: CreateRecommendationFeedbackDto = {
        feedbackType: FeedbackType.HELPFUL,
        source: FeedbackSource.USER,
        comment: 'This was very helpful!',
        impactScore: 85,
        metadata: {
          resourceType: RecommendationType.VIDEO,
          duration: 15,
        },
      };

      const result = service.validateAndSanitize(feedback);
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.sanitized).toMatchObject(feedback);
      expect(result.sanitized.metadata.confidenceScore).toBeGreaterThan(0);
      expect(result.sanitized.metadata.qualityScore).toBeGreaterThan(0);
      expect(result.sentiment).toBeDefined();
      expect(result.sentiment?.score).toBeGreaterThan(0);
    });

    it('should truncate and flag long comments', () => {
      const longComment = 'a'.repeat(2000);
      const feedback: CreateRecommendationFeedbackDto = {
        feedbackType: FeedbackType.HELPFUL,
        comment: longComment,
      };

      const result = service.validateAndSanitize(feedback);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Comment exceeds maximum length of 1000 characters');
      expect(result.sanitized.comment!.length).toBe(1000);
    });

    it('should sanitize and flag potentially unsafe comments', () => {
      const feedback: CreateRecommendationFeedbackDto = {
        feedbackType: FeedbackType.HELPFUL,
        comment: '<script>alert("xss")</script>',
      };

      const result = service.validateAndSanitize(feedback);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Comment contains potentially unsafe content');
      expect(result.sanitized.comment).not.toContain('<script>');
      expect(result.sanitized.comment).not.toContain('</script>');
    });

    it('should validate and adjust impact scores', () => {
      const feedback: CreateRecommendationFeedbackDto = {
        feedbackType: FeedbackType.HELPFUL,
        impactScore: 150, // Invalid score
      };

      const result = service.validateAndSanitize(feedback);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Impact score must be between 0 and 100');
      expect(result.sanitized.impactScore).toBe(100);
    });

    it('should flag inconsistent feedback types and impact scores', () => {
      const feedback: CreateRecommendationFeedbackDto = {
        feedbackType: FeedbackType.HELPFUL,
        impactScore: 30, // Low score but marked as helpful
      };

      const result = service.validateAndSanitize(feedback);
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Inconsistent feedback: HELPFUL feedback with low impact score');
    });

    it('should sanitize metadata', () => {
      const feedback: CreateRecommendationFeedbackDto = {
        feedbackType: FeedbackType.HELPFUL,
        metadata: {
          resourceType: RecommendationType.VIDEO,
          validNumber: 42,
          validString: 'test',
          validBoolean: true,
          validNull: null,
          validArray: [1, 2, 3],
          invalidFunction: () => {}, // Should be removed
          invalidDate: new Date(), // Should be removed
          nestedObject: {
            valid: 'yes',
            invalid: () => {}, // Should be removed
          },
        },
      };

      const result = service.validateAndSanitize(feedback);
      expect(result.isValid).toBe(true);
      expect(result.sanitized.metadata).toEqual({
        resourceType: RecommendationType.VIDEO,
        validNumber: 42,
        validString: 'test',
        validBoolean: true,
        validNull: null,
        validArray: [1, 2, 3],
        nestedObject: {
          valid: 'yes',
        },
        confidenceScore: expect.any(Number),
        qualityScore: expect.any(Number),
      });
    });

    it('should analyze sentiment of positive feedback', () => {
      const feedback: CreateRecommendationFeedbackDto = {
        feedbackType: FeedbackType.HELPFUL,
        comment: 'This was excellent and very helpful for my learning!',
        impactScore: 90,
      };

      const result = service.validateAndSanitize(feedback);
      expect(result.sentiment?.score).toBeGreaterThan(0);
      expect(result.sentiment?.comparative).toBeGreaterThan(0);
    });

    it('should analyze sentiment of negative feedback', () => {
      const feedback: CreateRecommendationFeedbackDto = {
        feedbackType: FeedbackType.NOT_HELPFUL,
        comment: 'This was confusing and not helpful at all.',
        impactScore: 20,
      };

      const result = service.validateAndSanitize(feedback);
      expect(result.sentiment?.score).toBeLessThan(0);
      expect(result.sentiment?.comparative).toBeLessThan(0);
    });

    it('should calculate high quality score for consistent feedback', () => {
      const feedback: CreateRecommendationFeedbackDto = {
        feedbackType: FeedbackType.HELPFUL,
        comment: 'This was very helpful and improved my understanding significantly.',
        impactScore: 85,
        metadata: { resourceType: RecommendationType.VIDEO },
      };

      const result = service.validateAndSanitize(feedback);
      expect(result.sanitized.metadata.qualityScore).toBeGreaterThanOrEqual(0.8);
    });

    it('should calculate low quality score for inconsistent feedback', () => {
      const feedback: CreateRecommendationFeedbackDto = {
        feedbackType: FeedbackType.HELPFUL,
        comment: 'This was not helpful at all.',
        impactScore: 30,
      };

      const result = service.validateAndSanitize(feedback);
      expect(result.sanitized.metadata.qualityScore).toBeLessThan(0.5);
    });
  });

  describe('calculateConfidenceScore', () => {
    it('should calculate high confidence for complete feedback', () => {
      const feedback: CreateRecommendationFeedbackDto = {
        feedbackType: FeedbackType.HELPFUL,
        comment: 'This was very helpful and improved my understanding significantly.',
        impactScore: 85,
        metadata: { resourceType: RecommendationType.VIDEO },
      };

      const result = service.validateAndSanitize(feedback);
      expect(result.sanitized.metadata.confidenceScore).toBeGreaterThanOrEqual(0.8);
    });

    it('should calculate low confidence for minimal feedback', () => {
      const feedback: CreateRecommendationFeedbackDto = {
        feedbackType: FeedbackType.HELPFUL,
      };

      const result = service.validateAndSanitize(feedback);
      expect(result.sanitized.metadata.confidenceScore).toBeLessThanOrEqual(0.3);
    });

    it('should penalize inconsistent feedback', () => {
      const feedback: CreateRecommendationFeedbackDto = {
        feedbackType: FeedbackType.HELPFUL,
        comment: 'This was very helpful!',
        impactScore: 30, // Inconsistent with HELPFUL
      };

      const result = service.validateAndSanitize(feedback);
      expect(result.sanitized.metadata.confidenceScore).toBeLessThan(0.8);
    });
  });

  describe('sanitizeComment', () => {
    it('should remove HTML tags', () => {
      const feedback: CreateRecommendationFeedbackDto = {
        feedbackType: FeedbackType.HELPFUL,
        comment: '<div>Test</div><script>alert("xss")</script>',
      };

      const result = service.validateAndSanitize(feedback);
      expect(result.sanitized.comment).toBe('Test[REMOVED]alert("xss")[REMOVED]');
    });

    it('should handle null and undefined comments', () => {
      const feedback: CreateRecommendationFeedbackDto = {
        feedbackType: FeedbackType.HELPFUL,
      };

      const result = service.validateAndSanitize(feedback);
      expect(result.isValid).toBe(true);
      expect(result.sanitized.comment).toBeUndefined();
    });

    it('should remove excessive whitespace', () => {
      const feedback: CreateRecommendationFeedbackDto = {
        feedbackType: FeedbackType.HELPFUL,
        comment: '  This   has   extra   spaces  ',
      };

      const result = service.validateAndSanitize(feedback);
      expect(result.sanitized.comment).toBe('This has extra spaces');
    });
  });

  describe('sentiment analysis', () => {
    it('should handle empty comments', () => {
      const feedback: CreateRecommendationFeedbackDto = {
        feedbackType: FeedbackType.HELPFUL,
      };

      const result = service.validateAndSanitize(feedback);
      expect(result.sentiment).toBeUndefined();
    });

    it('should handle neutral comments', () => {
      const feedback: CreateRecommendationFeedbackDto = {
        feedbackType: FeedbackType.PARTIALLY_HELPFUL,
        comment: 'The content was okay but could be improved.',
      };

      const result = service.validateAndSanitize(feedback);
      expect(result.sentiment?.score).toBeCloseTo(0, 1);
    });

    it('should handle mixed sentiment comments', () => {
      const feedback: CreateRecommendationFeedbackDto = {
        feedbackType: FeedbackType.PARTIALLY_HELPFUL,
        comment: 'The content was good but the examples were confusing.',
      };

      const result = service.validateAndSanitize(feedback);
      expect(result.sentiment).toBeDefined();
    });
  });

  describe('priority scoring', () => {
    it('should calculate priority score for high-priority feedback', () => {
      const feedback: CreateRecommendationFeedbackDto = {
        feedbackType: FeedbackType.NOT_HELPFUL,
        comment: 'This is urgent and critical! The feature is broken.',
        impactScore: 90,
        metadata: {
          userEngagement: 80,
          resourceType: RecommendationType.VIDEO,
        },
      };

      const result = service.validateAndSanitize(feedback);

      expect(result.priority).toBeDefined();
      expect(result.priority?.score).toBeGreaterThan(0.7);
      expect(result.priority?.factors.urgency).toBeGreaterThan(0.5);
      expect(result.priority?.factors.impact).toBeGreaterThan(0.8);
      expect(result.priority?.factors.userEngagement).toBeGreaterThan(0.7);
    });

    it('should calculate priority score for low-priority feedback', () => {
      const feedback: CreateRecommendationFeedbackDto = {
        feedbackType: FeedbackType.HELPFUL,
        comment: 'This was okay.',
        impactScore: 50,
        metadata: {
          userEngagement: 30,
          resourceType: RecommendationType.VIDEO,
        },
      };

      const result = service.validateAndSanitize(feedback);

      expect(result.priority).toBeDefined();
      expect(result.priority?.score).toBeLessThan(0.5);
      expect(result.priority?.factors.urgency).toBe(0);
      expect(result.priority?.factors.impact).toBe(0.5);
      expect(result.priority?.factors.userEngagement).toBe(0.3);
    });

    it('should handle feedback without optional fields', () => {
      const feedback: CreateRecommendationFeedbackDto = {
        feedbackType: FeedbackType.HELPFUL,
        comment: 'Good',
      };

      const result = service.validateAndSanitize(feedback);

      expect(result.priority).toBeDefined();
      expect(result.priority?.score).toBeGreaterThanOrEqual(0);
      expect(result.priority?.score).toBeLessThanOrEqual(1);
      expect(result.priority?.factors.urgency).toBe(0);
      expect(result.priority?.factors.impact).toBe(0);
      expect(result.priority?.factors.userEngagement).toBe(0);
    });

    it('should cap urgency factor at 1', () => {
      const feedback: CreateRecommendationFeedbackDto = {
        feedbackType: FeedbackType.NOT_HELPFUL,
        comment: 'This is urgent and critical! The feature is broken. This is a major problem that needs immediate attention.',
        impactScore: 90,
        metadata: {
          userEngagement: 80,
          resourceType: RecommendationType.VIDEO,
        },
      };

      const result = service.validateAndSanitize(feedback);

      expect(result.priority).toBeDefined();
      expect(result.priority?.factors.urgency).toBeLessThanOrEqual(1);
    });
  });
}); 