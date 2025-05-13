import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module'; // Assuming AppModule imports RecommendationsModule
import { RecommendationsController } from '../src/recommendations.controller';
import { RecommendationsService } from '../src/recommendations.service';
import { LlmFactoryService } from '../src/llm/llm-factory.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { RolesGuard } from '../src/guards/roles.guard';
import { UserRole } from '../src/entities/user.entity';
import { 
  RecommendationSetDto, 
  RecommendationDto, 
  RecommendationResourceDto, 
  RecommendationType, 
  RecommendationPriority 
} from '../src/dto/recommendation.dto';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/entities/user.entity';
import { AuthService } from '../src/auth.service';
import { v4 as uuidv4 } from 'uuid';

// --- Mocks ---
const mockRecommendationsService = {
  getRecommendations: jest.fn(),
  markRecommendationCompleted: jest.fn(),
  getUserRecommendationHistory: jest.fn(),
  getRecommendationResources: jest.fn(),
  createRecommendationResource: jest.fn(),
  explainSkillGap: jest.fn(),
  // Add other methods used by the controller if needed
};

const mockLlmFactoryService = {
  getProvider: jest.fn(),
  getAllProviders: jest.fn(() => new Map()), // Return empty map initially
  getDefaultProvider: jest.fn(() => ({ getConfig: () => ({ type: 'mock' }) })),
  setDefaultProvider: jest.fn(),
  getCacheService: jest.fn(() => ({ // Mock the cache service methods needed
    getStats: jest.fn().mockResolvedValue({ enabled: true, size: 0, maxSize: 100, ttlSeconds: 3600, metrics: { hits: 0, misses: 0 } }),
    clearCache: jest.fn().mockResolvedValue({ success: true }),
    resetMetrics: jest.fn().mockResolvedValue({ success: true }),
  })),
  updateProviderConfig: jest.fn().mockResolvedValue({ success: true, cache: { invalidated: false } }),
};

// Mock user object for guards
const mockUser = (role: UserRole, userId = 'test-user-id') => ({
  userId,
  role,
});

// Mock JwtAuthGuard to inject user based on role
const mockJwtAuthGuard = {
  canActivate: (context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    // Default to STUDENT user if no role specified in test
    req.user = req.user || mockUser(UserRole.STUDENT); // Use correct enum casing
    return true; // Allow access
  },
};

// Mock RolesGuard (canActivate will often be overridden in specific tests)
const mockRolesGuard = {
    canActivate: jest.fn().mockReturnValue(true), // Default allow, override per test
};

// Helper to create a mock RecommendationSetDto
const createMockRecSet = (userId: string, recommendations: RecommendationDto[] = []): RecommendationSetDto => ({
    userId,
    generatedAt: new Date(),
    recommendations,
    overallProgress: 0.5,
    summary: 'Mock summary',
});

// Helper to create a mock RecommendationResourceDto
const createMockResource = (id: string, title: string): RecommendationResourceDto => ({
    id,
    title,
    description: 'Mock description',
    url: 'http://mock.url',
    type: RecommendationType.LESSON,
    estimatedTimeMinutes: 10,
    tags: ['mock-tag'],
});

// Helper to create a mock RecommendationDto
const createMockRec = (id: string, resourceId: string, resourceTitle: string): RecommendationDto => ({
    id,
    resources: [createMockResource(resourceId, resourceTitle)],
    skillId: 'mock-skill-id', 
    skillName: 'Mock Skill',
    priority: RecommendationPriority.MEDIUM,
    score: 60,
    targetScore: 80,
    explanation: 'Mock explanation for recommendation',
    aiGenerated: false,
});


describe('RecommendationsController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let authService: AuthService;
  let studentToken: string;
  let testStudent: User;

  // Sample Credentials
  const studentCredentials = { email: 'student_rec_e2e@test.com', password: 'password', role: UserRole.STUDENT, gradeLevel: 7 };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    // Override the actual service with the mock
    .overrideProvider(RecommendationsService)
    .useValue(mockRecommendationsService)
    .overrideProvider(LlmFactoryService)
    .useValue(mockLlmFactoryService)
    .overrideGuard(JwtAuthGuard) // Override the actual guard with our mock
    .useValue(mockJwtAuthGuard)
    .overrideGuard(RolesGuard) // Override RolesGuard
    .useValue(mockRolesGuard)
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    // Get services and repositories
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    authService = moduleFixture.get<AuthService>(AuthService);

    // Clean up potential existing test data
    await userRepository.delete({ email: studentCredentials.email });

    // Create initial test user
    try {
        testStudent = await authService.register(studentCredentials) as User;
    } catch (error) { 
        console.warn('Student user for Recommendations E2E might already exist');
        testStudent = await userRepository.findOneByOrFail({email: studentCredentials.email});
     }

    // Generate JWT token
    studentToken = (await authService.login({ email: studentCredentials.email, password: studentCredentials.password })).access_token;
  });

  afterAll(async () => {
    // Clean up test user
    await userRepository.delete({ email: studentCredentials.email });
    await app.close();
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  // --- Test Suites --- 

  describe('GET /recommendations', () => {

    it('should get recommendations for authenticated user - 200', () => {
      const mockRecommendations = [
        { id: 'rec-1', type: 'practice_question', details: { questionId: 'q-1' } },
        { id: 'rec-2', type: 'learning_material', details: { url: 'http://example.com' } },
      ];
      mockRecommendationsService.getRecommendations.mockResolvedValue(mockRecommendations);

      return request(app.getHttpServer())
        .get('/recommendations')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(mockRecommendationsService.getRecommendations).toHaveBeenCalledWith(testStudent.id, undefined); // Check service called correctly
          expect(res.body).toEqual(mockRecommendations);
        });
    });

    it('should get recommendations with limit query parameter - 200', () => {
        const mockRecommendations = [
            { id: 'rec-limit-1', type: 'practice_question', details: { questionId: 'q-limit-1' } },
        ];
        mockRecommendationsService.getRecommendations.mockResolvedValue(mockRecommendations);
        const limit = 1;
  
        return request(app.getHttpServer())
          .get(`/recommendations?limit=${limit}`)
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(HttpStatus.OK)
          .expect((res) => {
            expect(mockRecommendationsService.getRecommendations).toHaveBeenCalledWith(testStudent.id, limit); // Check service called with limit
            expect(res.body).toEqual(mockRecommendations);
            expect(res.body.length).toEqual(limit);
          });
      });

    it('should fail GET /recommendations without authentication - 401', () => {
        return request(app.getHttpServer())
            .get('/recommendations')
            .expect(HttpStatus.UNAUTHORIZED);
    });
    
    it('should handle invalid limit query parameter - 400', () => {
        return request(app.getHttpServer())
            .get('/recommendations?limit=abc') // Invalid limit
            .set('Authorization', `Bearer ${studentToken}`)
            .expect(HttpStatus.BAD_REQUEST); // Expect validation pipe to catch this
    });

    it('should handle errors from RecommendationsService - 500', () => {
      mockRecommendationsService.getRecommendations.mockRejectedValue(new Error('Service Error'));

      return request(app.getHttpServer())
        .get('/recommendations')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR); // Or appropriate error code based on exception filter
    });

    // Add more tests for other scenarios if needed (e.g., different user types, specific skill filters if implemented)

  });

  // Add describe blocks for other potential recommendation endpoints (e.g., POST /mark-completed, GET /history) if they exist

}); 