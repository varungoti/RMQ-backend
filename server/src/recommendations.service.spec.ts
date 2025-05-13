import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsService } from './recommendations.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';

import { User, UserRole } from './entities/user.entity';
import { Skill, SkillStatus } from './entities/skill.entity';
import { AssessmentSkillScore } from './entities/assessment_skill_score.entity';
import { AssessmentSession, AssessmentStatus } from './entities/assessment_session.entity';
import { AssessmentResponse } from './entities/assessment_response.entity';
import { RecommendationResource } from './entities/recommendation_resource.entity';
import { RecommendationHistory } from './entities/recommendation_history.entity';
import { AiRecommendationService } from './ai-recommendation.service';
import { RecommendationPriority, RecommendationType } from './dto/recommendation.dto';

// Mock TypeORM repository type
type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

// Factory function for creating mocks
const createMockRepository = <T = any>(): MockRepository<T> => ({
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  // Add other methods if needed by the service
});

// Mock AI Recommendation Service
const mockAiRecommendationService = {
  isEnabled: jest.fn(),
  generateRecommendation: jest.fn(),
};

// Mock Config Service
const mockConfigService = {
  get: jest.fn(),
};

// --- Mock Data --- 
const mockUserId = 'user-rec-123';
const mockUser: User = { 
    id: mockUserId, email: 'rec@test.com', passwordHash: 'hash', role: UserRole.STUDENT, gradeLevel: 7, createdAt: new Date(), updatedAt: new Date(), assessmentSessions: [] 
};
const mockSkill1: Skill = { id: 'skill-rec-1', name: 'Skill Rec 1', subject: 'Sub', gradeLevel: 7, description: '', status: SkillStatus.ACTIVE, isPrimary: true, isSecondary: false, createdAt: new Date(), updatedAt: new Date(), questions: [], skillScores: [], primarySkills: [], secondarySkills: [] };
const mockSkill2: Skill = { id: 'skill-rec-2', name: 'Skill Rec 2', subject: 'Sub', gradeLevel: 7, description: '', status: SkillStatus.ACTIVE, isPrimary: true, isSecondary: false, createdAt: new Date(), updatedAt: new Date(), questions: [], skillScores: [], primarySkills: [], secondarySkills: [] };
const mockSession1: AssessmentSession = { 
    id: 'sess-rec-1', 
    user: mockUser, 
    status: AssessmentStatus.COMPLETED, 
    startedAt: new Date(2023, 10, 1), 
    completedAt: new Date(), 
    questionIds: [], 
    skill: mockSkill1,
    responses: [], 
    skillScores: [] 
};
const mockSession2: AssessmentSession = { 
    id: 'sess-rec-2', 
    user: mockUser, 
    status: AssessmentStatus.COMPLETED, 
    startedAt: new Date(2023, 10, 10), 
    completedAt: new Date(), 
    questionIds: [], 
    skill: mockSkill1,
    responses: [], 
    skillScores: [] 
}; // Newer session

const mockScore1Low: AssessmentSkillScore = { id: 'score-rec-1', assessmentSession: mockSession1, skill: mockSkill1, score: 400, questionsAttempted: 5 };
const mockScore1Ok: AssessmentSkillScore = { id: 'score-rec-2', assessmentSession: mockSession2, skill: mockSkill1, score: 600, questionsAttempted: 5 }; // Newer score for skill 1
const mockScore2Low: AssessmentSkillScore = { id: 'score-rec-3', assessmentSession: mockSession2, skill: mockSkill2, score: 500, questionsAttempted: 3 };

const mockResource1: RecommendationResource = { 
    id: 'res-rec-1', title: 'Resource 1', url: 'http://res1.com', 
    type: RecommendationType.VIDEO,
    gradeLevel: 7, relatedSkills: [mockSkill1], 
    description: '', estimatedTimeMinutes: 10, tags: [], isAiGenerated: false, createdAt: new Date(), updatedAt: new Date() 
};
const mockResource2: RecommendationResource = { 
    id: 'res-rec-2', title: 'Resource 2', url: 'http://res2.com', 
    type: RecommendationType.LESSON,
    gradeLevel: 7, relatedSkills: [mockSkill2], 
    description: '', estimatedTimeMinutes: 5, tags: [], isAiGenerated: false, createdAt: new Date(), updatedAt: new Date() 
};


describe('RecommendationsService', () => {
  let service: RecommendationsService;
  let usersRepository: MockRepository<User>;
  let skillsRepository: MockRepository<Skill>;
  let scoresRepository: MockRepository<AssessmentSkillScore>;
  let sessionsRepository: MockRepository<AssessmentSession>;
  let responsesRepository: MockRepository<AssessmentResponse>;
  let resourcesRepository: MockRepository<RecommendationResource>;
  let historyRepository: MockRepository<RecommendationHistory>;
  let aiRecommendationService: typeof mockAiRecommendationService;
  let configService: typeof mockConfigService;

  beforeEach(async () => {
    usersRepository = createMockRepository<User>();
    skillsRepository = createMockRepository<Skill>();
    scoresRepository = createMockRepository<AssessmentSkillScore>();
    sessionsRepository = createMockRepository<AssessmentSession>();
    responsesRepository = createMockRepository<AssessmentResponse>();
    resourcesRepository = createMockRepository<RecommendationResource>();
    historyRepository = createMockRepository<RecommendationHistory>();
    // Reset AI and Config mocks
    aiRecommendationService = { ...mockAiRecommendationService, isEnabled: jest.fn(), generateRecommendation: jest.fn() };
    configService = { ...mockConfigService, get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: getRepositoryToken(Skill), useValue: skillsRepository },
        { provide: getRepositoryToken(AssessmentSkillScore), useValue: scoresRepository },
        { provide: getRepositoryToken(AssessmentSession), useValue: sessionsRepository },
        { provide: getRepositoryToken(AssessmentResponse), useValue: responsesRepository },
        { provide: getRepositoryToken(RecommendationResource), useValue: resourcesRepository },
        { provide: getRepositoryToken(RecommendationHistory), useValue: historyRepository },
        { provide: ConfigService, useValue: configService },
        { provide: AiRecommendationService, useValue: aiRecommendationService },
      ],
    }).compile();

    service = module.get<RecommendationsService>(RecommendationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRecommendations', () => {
    beforeEach(() => {
      // Common mocks for getRecommendations
      usersRepository.findOneBy.mockResolvedValue(mockUser);
      scoresRepository.find.mockResolvedValue([mockScore1Low, mockScore1Ok, mockScore2Low]);
      resourcesRepository.find.mockImplementation(async (options: any) => {
        // Simple mock: return resource based on skill ID in where clause
        const skillId = options?.where?.relatedSkills?.id;
        if (skillId === mockSkill1.id) return [mockResource1];
        if (skillId === mockSkill2.id) return [mockResource2];
        return [];
      });
      historyRepository.create.mockImplementation((dto) => ({ ...dto, id: 'hist-rec-new' }));
      historyRepository.save.mockResolvedValue({});
      aiRecommendationService.isEnabled.mockReturnValue(false); // Disable AI by default
    });

    it('should return recommendations for skills below threshold, sorted by score', async () => {
      const result = await service.getRecommendations(mockUserId);

      expect(usersRepository.findOneBy).toHaveBeenCalledWith({ id: mockUserId });
      expect(scoresRepository.find).toHaveBeenCalled();
      
      // Skill 2 (score 500) is below threshold (550), Skill 1 (latest score 600) is not.
      expect(result.recommendations).toHaveLength(1); 
      expect(result.recommendations[0].skillId).toEqual(mockSkill2.id); // Lowest score first (500)
      expect(result.recommendations[0].priority).toEqual(RecommendationPriority.HIGH);
      expect(result.recommendations[0].resource.id).toEqual(mockResource2.id);

      // Check if history was saved for the recommendation
      expect(historyRepository.create).toHaveBeenCalledTimes(1);
      expect(historyRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if user not found', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);
      await expect(service.getRecommendations(mockUserId)).rejects.toThrow(NotFoundException);
    });
    
    it('should limit recommendations based on queryParams.limit', async () => {
      // Arrange: Make both skills gaps to test limit
      const lowScore1 = { ...mockScore1Ok, score: 400 }; // Ensure skill 1 is also a gap
      scoresRepository.find.mockResolvedValue([lowScore1, mockScore2Low]); // Only return low scores
      
      const result = await service.getRecommendations(mockUserId, { limit: 1 });

      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].skillId).toEqual(mockSkill1.id); // Lowest score (400) first
    });

    it('should filter recommendations based on queryParams.skillId', async () => {
      // Arrange: Only skill 2 has a low score in default setup
      const result = await service.getRecommendations(mockUserId, { skillId: mockSkill2.id });

      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].skillId).toEqual(mockSkill2.id);
    });

    it('should add specified skillId even if score is not low', async () => {
       // Arrange: Skill 1 latest score is 600 (not low), Skill 2 is 500 (low)
       const result = await service.getRecommendations(mockUserId, { skillId: mockSkill1.id });

       // Expect recommendations for Skill 2 (low score) AND Skill 1 (specified)
       expect(result.recommendations).toHaveLength(2);
       expect(result.recommendations.some(r => r.skillId === mockSkill1.id)).toBe(true);
       expect(result.recommendations.some(r => r.skillId === mockSkill2.id)).toBe(true);
       // Ensure specified skill is added, potentially with medium priority
       const skill1Rec = result.recommendations.find(r => r.skillId === mockSkill1.id);
       expect(skill1Rec?.priority).toEqual(RecommendationPriority.MEDIUM); // Or LOW depending on logic
    });

    it('should add specified skillId with default score if no score exists', async () => {
      const mockSkill3: Skill = { ...mockSkill1, id: 'skill-rec-3', name: 'Untested Skill' };
      skillsRepository.findOneBy.mockResolvedValue(mockSkill3);
      // Arrange: Only Skill 2 has a low score, user hasn't been tested on Skill 3
      const result = await service.getRecommendations(mockUserId, { skillId: mockSkill3.id });

      expect(skillsRepository.findOneBy).toHaveBeenCalledWith({ id: mockSkill3.id });
      expect(result.recommendations).toHaveLength(2); // Skill 2 (low score) + Skill 3 (specified)
      expect(result.recommendations.some(r => r.skillId === mockSkill3.id)).toBe(true);
      const skill3Rec = result.recommendations.find(r => r.skillId === mockSkill3.id);
      expect(skill3Rec?.score).toEqual(500); // Check if default score was used
      expect(skill3Rec?.priority).toEqual(RecommendationPriority.HIGH); // Should be high priority as score is low
    });

    it('should call AI service for critical skill gaps if enabled', async () => {
      // Arrange: Make skill 2 critically low
      const criticalScore2 = { ...mockScore2Low, score: 400 }; 
      scoresRepository.find.mockResolvedValue([mockScore1Ok, criticalScore2]); // Use critical score for skill 2
      aiRecommendationService.isEnabled.mockReturnValue(true); // Enable AI
      const aiGeneratedExplanation = 'AI says practice this!';
      aiRecommendationService.generateRecommendation.mockResolvedValue(aiGeneratedExplanation);
      responsesRepository.find.mockResolvedValue([]); // Mock response history
      
      const result = await service.getRecommendations(mockUserId);

      expect(aiRecommendationService.isEnabled).toHaveBeenCalled();
      expect(responsesRepository.find).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ question: { primarySkill: { id: mockSkill2.id } } })
      }));
      expect(aiRecommendationService.generateRecommendation).toHaveBeenCalledWith(
        mockUserId,
        mockSkill2,
        criticalScore2.score,
        [] // Empty history in this mock
      );
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].skillId).toEqual(mockSkill2.id);
      expect(result.recommendations[0].explanation).toEqual(aiGeneratedExplanation);
      expect(result.recommendations[0].aiGenerated).toBe(true);
      expect(result.recommendations[0].priority).toEqual(RecommendationPriority.CRITICAL);
      
      // Verify history save included AI flag and explanation
      expect(historyRepository.create).toHaveBeenCalledWith(expect.objectContaining({ 
        explanation: aiGeneratedExplanation, 
        isAiGenerated: true, 
        skill: mockSkill2,
        userScore: criticalScore2.score,
        priority: RecommendationPriority.CRITICAL
      }));
    });

    it('should fallback to standard recommendation if AI service fails', async () => {
      // Arrange: Critical gap, AI enabled, but AI call fails
      const criticalScore2 = { ...mockScore2Low, score: 400 }; 
      scoresRepository.find.mockResolvedValue([mockScore1Ok, criticalScore2]); 
      aiRecommendationService.isEnabled.mockReturnValue(true); 
      aiRecommendationService.generateRecommendation.mockRejectedValue(new Error('AI Timeout')); // Simulate AI error
      responsesRepository.find.mockResolvedValue([]);
      
      const result = await service.getRecommendations(mockUserId);

      expect(aiRecommendationService.generateRecommendation).toHaveBeenCalled();
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].skillId).toEqual(mockSkill2.id);
      expect(result.recommendations[0].explanation).not.toEqual('AI says practice this!'); // Should have standard explanation
      expect(result.recommendations[0].aiGenerated).toBe(false);
      expect(result.recommendations[0].priority).toEqual(RecommendationPriority.CRITICAL);
      expect(historyRepository.create).toHaveBeenCalledWith(expect.objectContaining({ 
        isAiGenerated: false, 
        priority: RecommendationPriority.CRITICAL
      }));
    });

    // Add test for when no relevant resources are found
    it('should not create a recommendation if no resource is found for a skill gap', async () => {
       // Arrange: Skill 2 has a low score, but no resources are found for it
       resourcesRepository.find.mockResolvedValue([]); // No resources found for any skill

       const result = await service.getRecommendations(mockUserId);

       expect(resourcesRepository.find).toHaveBeenCalled();
       expect(result.recommendations).toHaveLength(0); // No recommendations should be generated
       expect(historyRepository.create).not.toHaveBeenCalled();
       expect(historyRepository.save).not.toHaveBeenCalled();
    });

  });

  describe('markRecommendationCompleted', () => {
    const recommendationId = 'hist-rec-123';
    const mockHistoryItem: RecommendationHistory = {
      id: recommendationId,
      user: mockUser,
      skill: mockSkill1,
      resource: mockResource1,
      priority: RecommendationPriority.HIGH,
      userScore: 400,
      targetScore: 650,
      explanation: 'Test rec',
      isCompleted: false,
      completedAt: null,
      wasHelpful: null,
      isAiGenerated: false,
      createdAt: new Date(),
    };

    beforeEach(() => {
      historyRepository.findOne.mockReset();
      historyRepository.save.mockReset();
    });

    it('should mark a recommendation as completed and helpful', async () => {
      historyRepository.findOne.mockResolvedValue(mockHistoryItem);
      
      await service.markRecommendationCompleted(mockUserId, recommendationId, true);

      expect(historyRepository.findOne).toHaveBeenCalledWith({ 
        where: { id: recommendationId, user: { id: mockUserId } }
      });
      expect(historyRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: recommendationId,
        isCompleted: true,
        completedAt: expect.any(Date),
        wasHelpful: true,
      }));
    });

    it('should mark a recommendation as completed and not helpful', async () => {
      historyRepository.findOne.mockResolvedValue(mockHistoryItem);
      
      await service.markRecommendationCompleted(mockUserId, recommendationId, false);

      expect(historyRepository.findOne).toHaveBeenCalledWith({ 
        where: { id: recommendationId, user: { id: mockUserId } }
      });
      expect(historyRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: recommendationId,
        isCompleted: true,
        completedAt: expect.any(Date),
        wasHelpful: false,
      }));
    });

    it('should throw NotFoundException if recommendation not found or doesnt belong to user', async () => {
      historyRepository.findOne.mockResolvedValue(null);

      await expect(service.markRecommendationCompleted(mockUserId, recommendationId, true))
        .rejects.toThrow(NotFoundException);
      expect(historyRepository.findOne).toHaveBeenCalledWith({ 
        where: { id: recommendationId, user: { id: mockUserId } }
      });
      expect(historyRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getUserRecommendationHistory', () => {
    const mockHistoryItem1: RecommendationHistory = {
      id: 'hist-1',
      user: mockUser,
      skill: mockSkill1,
      resource: mockResource1,
      priority: RecommendationPriority.HIGH,
      userScore: 400, targetScore: 650, explanation: 'Rec 1',
      isCompleted: true, completedAt: new Date(), wasHelpful: true, isAiGenerated: false, createdAt: new Date(),
    };
    const mockHistoryItem2: RecommendationHistory = {
      id: 'hist-2',
      user: mockUser,
      skill: mockSkill2,
      resource: mockResource2,
      priority: RecommendationPriority.MEDIUM,
      userScore: 500, targetScore: 650, explanation: 'Rec 2',
      isCompleted: false, completedAt: null, wasHelpful: null, isAiGenerated: false, createdAt: new Date(),
    };

    beforeEach(() => {
      historyRepository.find.mockReset();
    });

    it('should return all history items for the user', async () => {
      historyRepository.find.mockResolvedValue([mockHistoryItem1, mockHistoryItem2]);

      const result = await service.getUserRecommendationHistory(mockUserId);

      expect(historyRepository.find).toHaveBeenCalledWith({ 
        where: { user: { id: mockUserId } },
        relations: ['skill', 'resource'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
      // Check structure of mapped result
      expect(result[0]).toEqual(expect.objectContaining({
        id: mockHistoryItem1.id,
        skillId: mockHistoryItem1.skill.id,
        resourceId: mockHistoryItem1.resource.id,
        isCompleted: true,
      }));
      expect(result[1]).toEqual(expect.objectContaining({
        id: mockHistoryItem2.id,
        skillId: mockHistoryItem2.skill.id,
        resourceId: mockHistoryItem2.resource.id,
        isCompleted: false,
      }));
    });

    it('should return only completed history items if completed=true', async () => {
      historyRepository.find.mockResolvedValue([mockHistoryItem1]); // Mock finds only completed

      const result = await service.getUserRecommendationHistory(mockUserId, true);

      expect(historyRepository.find).toHaveBeenCalledWith({ 
        where: { user: { id: mockUserId }, isCompleted: true }, // Check where clause
        relations: ['skill', 'resource'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual(mockHistoryItem1.id);
    });

    it('should return only incomplete history items if completed=false', async () => {
      historyRepository.find.mockResolvedValue([mockHistoryItem2]); // Mock finds only incomplete

      const result = await service.getUserRecommendationHistory(mockUserId, false);

      expect(historyRepository.find).toHaveBeenCalledWith({ 
        where: { user: { id: mockUserId }, isCompleted: false }, // Check where clause
        relations: ['skill', 'resource'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual(mockHistoryItem2.id);
    });

    it('should return an empty array if no history exists', async () => {
       historyRepository.find.mockResolvedValue([]);
       const result = await service.getUserRecommendationHistory(mockUserId);
       expect(result).toEqual([]);
    });
  });

}); 