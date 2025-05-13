import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeedbackAnalysisService } from './feedback-analysis.service';
import { RecommendationFeedback, FeedbackType, FeedbackSource } from 'src/entities/recommendation_feedback.entity';
import { Skill } from 'src/entities/skill.entity';
import { RecommendationType, RecommendationPriority } from 'src/dto/recommendation.dto';
import { User, UserRole } from 'src/entities/user.entity';
import { Recommendation } from 'src/entities/recommendation.entity';

describe('FeedbackAnalysisService', () => {
  let service: FeedbackAnalysisService;
  let feedbackRepository: Repository<RecommendationFeedback>;
  let skillRepository: Repository<Skill>;

  const mockFeedback = [
    {
      id: '1',
      feedbackType: FeedbackType.HELPFUL,
      comment: 'The content quality was excellent and very clear!',
      impactScore: 90,
      metadata: {
        sentiment: { score: 0.8, comparative: 0.4 },
        resourceType: RecommendationType.VIDEO,
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      userId: 'user1',
      recommendationId: 'rec1',
      source: FeedbackSource.USER,
      user: {
        id: 'user1',
        email: 'user1@test.com',
        passwordHash: 'hashed_password',
        firstName: 'Test',
        lastName: 'User 1',
        gradeLevel: 10,
        role: UserRole.STUDENT,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        assessmentSessions: [],
        skillScores: [],
      } as User,
      recommendation: {
        id: 'rec1',
        userId: 'user1',
        skillId: 'skill1',
        skillName: 'JavaScript',
        priority: RecommendationPriority.HIGH,
        score: 75,
        targetScore: 90,
        explanation: 'Practice JavaScript fundamentals',
        aiGenerated: true,
        resources: [],
        feedback: [],
        completed: false,
        completedAt: null,
        wasHelpful: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        user: {
          id: 'user1',
          email: 'user1@test.com',
          passwordHash: 'hashed_password',
          firstName: 'Test',
          lastName: 'User 1',
          gradeLevel: 10,
          role: UserRole.STUDENT,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          assessmentSessions: [],
          skillScores: [],
        } as User,
        skill: {
          category: 'programming',
          name: 'JavaScript',
        },
      } as Recommendation,
    },
    {
      id: '2',
      feedbackType: FeedbackType.NOT_HELPFUL,
      comment: 'The interface is confusing and not working properly.',
      impactScore: 20,
      metadata: {
        sentiment: { score: -0.6, comparative: -0.3 },
        resourceType: RecommendationType.LESSON,
      },
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      userId: 'user2',
      recommendationId: 'rec2',
      source: FeedbackSource.USER,
      user: {
        id: 'user2',
        email: 'user2@test.com',
        passwordHash: 'hashed_password',
        firstName: 'Test',
        lastName: 'User 2',
        gradeLevel: 11,
        role: UserRole.STUDENT,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        assessmentSessions: [],
        skillScores: [],
      } as User,
      recommendation: {
        id: 'rec2',
        userId: 'user2',
        skillId: 'skill2',
        skillName: 'Python',
        priority: RecommendationPriority.MEDIUM,
        score: 60,
        targetScore: 80,
        explanation: 'Learn Python basics',
        aiGenerated: true,
        resources: [],
        feedback: [],
        completed: false,
        completedAt: null,
        wasHelpful: null,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        user: {
          id: 'user2',
          email: 'user2@test.com',
          passwordHash: 'hashed_password',
          firstName: 'Test',
          lastName: 'User 2',
          gradeLevel: 11,
          role: UserRole.STUDENT,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          assessmentSessions: [],
          skillScores: [],
        } as User,
        skill: {
          category: 'programming',
          name: 'Python',
        },
      } as Recommendation,
    },
    {
      id: '3',
      feedbackType: FeedbackType.PARTIALLY_HELPFUL,
      comment: 'The system is too slow and has performance issues.',
      impactScore: 60,
      metadata: {
        sentiment: { score: 0.1, comparative: 0.05 },
        resourceType: RecommendationType.VIDEO,
      },
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
      userId: 'user3',
      recommendationId: 'rec3',
      source: FeedbackSource.USER,
      user: {
        id: 'user3',
        email: 'user3@test.com',
        passwordHash: 'hashed_password',
        firstName: 'Test',
        lastName: 'User 3',
        gradeLevel: 12,
        role: UserRole.STUDENT,
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
        assessmentSessions: [],
        skillScores: [],
      } as User,
      recommendation: {
        id: 'rec3',
        userId: 'user3',
        skillId: 'skill3',
        skillName: 'UI/UX',
        priority: RecommendationPriority.LOW,
        score: 85,
        targetScore: 95,
        explanation: 'Improve UI/UX skills',
        aiGenerated: true,
        resources: [],
        feedback: [],
        completed: false,
        completedAt: null,
        wasHelpful: null,
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
        user: {
          id: 'user3',
          email: 'user3@test.com',
          passwordHash: 'hashed_password',
          firstName: 'Test',
          lastName: 'User 3',
          gradeLevel: 12,
          role: UserRole.STUDENT,
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-03'),
          assessmentSessions: [],
          skillScores: [],
        } as User,
        skill: {
          category: 'design',
          name: 'UI/UX',
        },
      } as Recommendation,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackAnalysisService,
        {
          provide: getRepositoryToken(RecommendationFeedback),
          useValue: {
            find: jest.fn().mockResolvedValue(mockFeedback),
            findOne: jest.fn().mockImplementation((id) => 
              Promise.resolve(mockFeedback.find(f => f.id === id))
            ),
          },
        },
        {
          provide: getRepositoryToken(Skill),
          useValue: {
            find: jest.fn().mockResolvedValue([
              { id: 'skill1', name: 'JavaScript', category: 'programming' },
              { id: 'skill2', name: 'Python', category: 'programming' },
              { id: 'skill3', name: 'UI/UX', category: 'design' },
            ]),
          },
        },
      ],
    }).compile();

    service = module.get<FeedbackAnalysisService>(FeedbackAnalysisService);
    feedbackRepository = module.get<Repository<RecommendationFeedback>>(
      getRepositoryToken(RecommendationFeedback)
    );
    skillRepository = module.get<Repository<Skill>>(
      getRepositoryToken(Skill)
    );
  });

  describe('analyzeTrends', () => {
    it('should analyze feedback trends with sentiment', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const trends = await service.analyzeTrends(startDate, endDate, 'week');

      expect(trends).toBeDefined();
      expect(trends.length).toBeGreaterThan(0);
      expect(trends[0]).toHaveProperty('sentimentTrend');
      expect(trends[0].sentimentTrend).toHaveProperty('averageScore');
      expect(trends[0].sentimentTrend).toHaveProperty('positivePercentage');
      expect(trends[0].sentimentTrend).toHaveProperty('negativePercentage');
    });

    it('should calculate correct sentiment percentages', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const trends = await service.analyzeTrends(startDate, endDate, 'week');

      expect(trends[0].sentimentTrend.positivePercentage).toBeGreaterThan(0);
      expect(trends[0].sentimentTrend.negativePercentage).toBeGreaterThan(0);
      expect(trends[0].sentimentTrend.averageScore).toBeDefined();
    });
  });

  describe('analyzeBySkillCategory', () => {
    it('should analyze feedback by skill category with sentiment', async () => {
      const analysis = await service.analyzeBySkillCategory();

      expect(analysis).toBeDefined();
      expect(analysis.length).toBeGreaterThan(0);
      expect(analysis[0]).toHaveProperty('sentimentAnalysis');
      expect(analysis[0].sentimentAnalysis).toHaveProperty('averageScore');
      expect(analysis[0].sentimentAnalysis).toHaveProperty('positivePercentage');
      expect(analysis[0].sentimentAnalysis).toHaveProperty('negativePercentage');
    });

    it('should include feedback clusters', async () => {
      const analysis = await service.analyzeBySkillCategory();

      expect(analysis[0]).toHaveProperty('clusters');
      expect(Array.isArray(analysis[0].clusters)).toBe(true);
      if (analysis[0].clusters.length > 0) {
        expect(analysis[0].clusters[0]).toHaveProperty('commonThemes');
        expect(analysis[0].clusters[0]).toHaveProperty('averageSentiment');
      }
    });
  });

  describe('analyzeResourceTypes', () => {
    it('should analyze resource types with sentiment', async () => {
      const analysis = await service.analyzeResourceTypes();

      expect(analysis).toBeDefined();
      expect(analysis.length).toBeGreaterThan(0);
      expect(analysis[0]).toHaveProperty('sentimentAnalysis');
      expect(analysis[0].sentimentAnalysis).toHaveProperty('averageScore');
      expect(analysis[0].sentimentAnalysis).toHaveProperty('positivePercentage');
      expect(analysis[0].sentimentAnalysis).toHaveProperty('negativePercentage');
    });

    it('should calculate correct resource type effectiveness', async () => {
      const analysis = await service.analyzeResourceTypes();

      const videoAnalysis = analysis.find(a => a.type === RecommendationType.VIDEO);
      expect(videoAnalysis).toBeDefined();
      expect(videoAnalysis?.helpfulPercentage).toBeGreaterThan(0);
      expect(videoAnalysis?.averageImpactScore).toBeGreaterThan(0);
    });
  });

  describe('categorizeFeedback', () => {
    it('should categorize feedback based on content and metadata', async () => {
      const categorization = await service.categorizeFeedback(mockFeedback[0]);

      expect(categorization).toBeDefined();
      expect(categorization.primaryCategory).toBeDefined();
      expect(categorization.confidence).toBeGreaterThanOrEqual(0);
      expect(categorization.categories).toBeDefined();
      expect(categorization.categories.length).toBeGreaterThan(0);
      expect(categorization.categories[0].name).toBeDefined();
      expect(categorization.categories[0].confidence).toBeDefined();
      expect(categorization.categories[0].matchedKeywords).toBeDefined();
    });

    it('should handle feedback with multiple categories', async () => {
      const multiCategoryFeedback = {
        ...mockFeedback[0],
        comment: 'The content is excellent but the interface is confusing and slow.',
      };

      const categorization = await service.categorizeFeedback(multiCategoryFeedback);

      expect(categorization.categories.length).toBeGreaterThan(1);
      expect(categorization.categories.some(c => c.name === 'Content Quality')).toBe(true);
      expect(categorization.categories.some(c => c.name === 'User Experience')).toBe(true);
      expect(categorization.categories.some(c => c.name === 'Performance')).toBe(true);
    });

    it('should handle feedback with no clear category', async () => {
      const neutralFeedback = {
        ...mockFeedback[0],
        comment: 'I tried it out.',
      };

      const categorization = await service.categorizeFeedback(neutralFeedback);

      expect(categorization.primaryCategory).toBe('Uncategorized');
      expect(categorization.confidence).toBe(0);
      expect(categorization.categories.length).toBe(0);
    });

    it('should handle feedback without comment', async () => {
      const noCommentFeedback = {
        ...mockFeedback[0],
        comment: undefined,
      };

      const categorization = await service.categorizeFeedback(noCommentFeedback);

      expect(categorization.primaryCategory).toBe('Uncategorized');
      expect(categorization.confidence).toBe(0);
      expect(categorization.categories.length).toBe(0);
    });
  });

  describe('analyzeTrends with categorization', () => {
    it('should include category distribution in trends', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const trends = await service.analyzeTrends(startDate, endDate, 'week');

      expect(trends[0]).toHaveProperty('categoryDistribution');
      expect(Array.isArray(trends[0].categoryDistribution)).toBe(true);
      expect(trends[0].categoryDistribution.length).toBeGreaterThan(0);
      expect(trends[0].categoryDistribution[0]).toHaveProperty('category');
      expect(trends[0].categoryDistribution[0]).toHaveProperty('percentage');
    });
  });
}); 