import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource, Repository, In } from 'typeorm';
import { User, UserRole } from '../../src/entities/user.entity';
import { Skill } from '../../src/entities/skill.entity';
import { Question, QuestionType } from '../../src/entities/question.entity';
import { AssessmentSession, AssessmentStatus } from '../../src/entities/assessment_session.entity';
import { AssessmentResponse } from '../../src/entities/assessment_response.entity';
import { AssessmentSkillScore } from '../../src/entities/assessment_skill_score.entity';
import { RecommendationHistory } from '../../src/entities/recommendation_history.entity';
import { GetNextQuestionResponseDto } from '../../src/dto/assessment.dto';
import { RecommendationSetDto } from '../../src/dto/recommendation.dto';

describe('Recommendation Flow (Integration)', () => {
  let app: INestApplication;
  let httpServer;
  let dataSource: DataSource;
  let userRepository: Repository<User>;
  let skillRepository: Repository<Skill>;
  let questionRepository: Repository<Question>;
  let sessionRepository: Repository<AssessmentSession>;
  let responseRepository: Repository<AssessmentResponse>;
  let scoreRepository: Repository<AssessmentSkillScore>;
  let historyRepository: Repository<RecommendationHistory>; // For cleanup

  let testUser: User;
  let testSkill: Skill;
  let testQuestions: Question[] = [];
  let userToken: string;
  let assessmentSessionId: string;

  const userCredentials = {
    email: `rec-user-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    role: UserRole.STUDENT,
    gradeLevel: 5,
  };

  const testSkillName = 'Integration Rec Skill';
  const testQuestionTexts = ['Rec Q1?', 'Rec Q2?'];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    await app.init();
    httpServer = app.getHttpServer();

    // Get repositories
    dataSource = moduleFixture.get<DataSource>(DataSource);
    userRepository = dataSource.getRepository(User);
    skillRepository = dataSource.getRepository(Skill);
    questionRepository = dataSource.getRepository(Question);
    sessionRepository = dataSource.getRepository(AssessmentSession);
    responseRepository = dataSource.getRepository(AssessmentResponse);
    scoreRepository = dataSource.getRepository(AssessmentSkillScore);
    historyRepository = dataSource.getRepository(RecommendationHistory);

    // --- Test Data Setup ---
    // Clean potential leftovers
    await userRepository.delete({ email: userCredentials.email });
    await skillRepository.delete({ name: testSkillName }); 
    await questionRepository.delete({ questionText: In(testQuestionTexts) });
    // Clean recommendation history linked to potentially leftover users/skills might be needed

    // 1. Create User
    testUser = (await request(httpServer).post('/auth/register').send(userCredentials).expect(HttpStatus.CREATED)).body;

    // 2. Login User
    userToken = (await request(httpServer).post('/auth/login').send({ email: userCredentials.email, password: userCredentials.password }).expect(HttpStatus.OK)).body.access_token;

    // 3. Create Skill
    testSkill = await skillRepository.save(skillRepository.create({ 
        name: testSkillName, 
        description: 'Skill for rec tests',
        subject: 'Integration Test Subject'
    }));

    // 4. Create Questions
    const q1 = questionRepository.create({ questionText: testQuestionTexts[0], questionType: QuestionType.MCQ, options: { A: 'Correct', B: 'Wrong'}, correctAnswer: 'A', difficultyLevel: 1, gradeLevel: 5, primarySkill: testSkill });
    const q2 = questionRepository.create({ questionText: testQuestionTexts[1], questionType: QuestionType.MCQ, options: { X: 'Wrong', Y: 'Correct'}, correctAnswer: 'Y', difficultyLevel: 2, gradeLevel: 5, primarySkill: testSkill });
    testQuestions = await questionRepository.save([q1, q2]);

    // --- Complete Assessment Flow --- 
    // 5. Start Session
    const startRes = await request(httpServer).post('/assessment/start').set('Authorization', `Bearer ${userToken}`).expect(HttpStatus.CREATED);
    assessmentSessionId = startRes.body.sessionId;
    let currentQuestion = startRes.body.question;

    // 6. Answer all questions (Intentionally answer one wrong to create a skill gap)
    // Answer Q1 Correctly
    await request(httpServer)
        .post(`/assessment/${assessmentSessionId}/submit`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ questionId: currentQuestion.id, answer: testQuestions.find(q => q.id === currentQuestion.id)!.correctAnswer })
        .expect(HttpStatus.CREATED);

    // Get Q2
    let nextRes = await request(httpServer).get(`/assessment/${assessmentSessionId}/next`).set('Authorization', `Bearer ${userToken}`).expect(HttpStatus.OK);
    currentQuestion = nextRes.body.nextQuestion;
    expect(currentQuestion).toBeDefined(); // Ensure we got the second question

    // Answer Q2 Incorrectly
    const q2Data = testQuestions.find(q => q.id === currentQuestion!.id)!;
    const incorrectAnswerQ2 = Object.keys(q2Data.options || {}).find(key => key !== q2Data.correctAnswer) || 'X';
    await request(httpServer)
        .post(`/assessment/${assessmentSessionId}/submit`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ questionId: currentQuestion!.id, answer: incorrectAnswerQ2 })
        .expect(HttpStatus.CREATED);
        
    // 7. Verify Completion
    nextRes = await request(httpServer).get(`/assessment/${assessmentSessionId}/next`).set('Authorization', `Bearer ${userToken}`).expect(HttpStatus.OK);
    expect(nextRes.body.isComplete).toBe(true);
    expect(nextRes.body.nextQuestion).toBeNull();

    // Verify session status in DB (optional but good)
    const finalSession = await sessionRepository.findOneBy({ id: assessmentSessionId });
    expect(finalSession?.status).toEqual(AssessmentStatus.COMPLETED);

  }, 30000); // Increase timeout for setup complexity

  afterAll(async () => {
    // Clean up test data
    try {
      // Delete history first
      if (testUser) {
          await historyRepository.delete({ user: { id: testUser.id } });
          console.log(`Cleaned up recommendation history for user: ${testUser.id}`);
      }
      if (assessmentSessionId) {
          const session = await sessionRepository.findOne({ where: { id: assessmentSessionId }, relations: ['responses'] });
          if (session) {
              if (session.responses?.length > 0) await responseRepository.remove(session.responses);
              // Remove any skill scores associated with this session's user and skill
              if (session.skill?.id) {
                  await scoreRepository.delete({ skill: { id: session.skill.id } });
              }
              await sessionRepository.delete({ id: assessmentSessionId });
              console.log(`Cleaned up assessment session: ${assessmentSessionId}`);
          }
      }
      if (testQuestions && testQuestions.length > 0) {
        const questionIds = testQuestions.map(q => q.id);
        await questionRepository.delete(questionIds);
        console.log(`Cleaned up ${testQuestions.length} test questions.`);
      }
      if (testSkill) {
        await skillRepository.delete({ id: testSkill.id });
        console.log(`Cleaned up test skill: ${testSkill.name}`);
      }
      if (testUser) {
        await userRepository.delete({ id: testUser.id });
        console.log(`Cleaned up test user: ${userCredentials.email}`);
      }
    } catch (error) {
        console.error(`Error during recommendation test cleanup: ${error?.message ?? error}`);
    }
    
    // Close app FIRST, then datasource
    if (app) { 
        await app.close();
    }
    if (dataSource?.isInitialized) {
        await dataSource.destroy();
    }
  }, 30000); // Increase timeout for cleanup complexity

  it('should generate recommendations after assessment completion', async () => {
      expect(userToken).toBeDefined();
      
      const response = await request(httpServer)
          .get('/recommendations')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(HttpStatus.OK);
          
      // The response could be in either format (ResponseWrapper or direct DTO)
      // Extract the actual data from the response
      const responseBody = response.body;
      
      // Check if this is the new ResponseWrapper format
      const isResponseWrapper = responseBody && 
                               typeof responseBody === 'object' && 
                               'success' in responseBody && 
                               'data' in responseBody;
      
      // Get the actual recommendation data
      const recommendationData = isResponseWrapper ? responseBody.data : responseBody;
      
      // Now test with the extracted data
      expect(recommendationData).toBeDefined();
      expect(recommendationData.userId).toEqual(testUser.id);
      expect(recommendationData.generatedAt).toBeDefined();
      expect(recommendationData.recommendations).toBeInstanceOf(Array);
      
      // Since we answered one wrong, we expect at least one recommendation for the test skill
      expect(recommendationData.recommendations.length).toBeGreaterThan(0);
      
      const recForTestSkill = recommendationData.recommendations.find(rec => rec.skillId === testSkill.id);
      expect(recForTestSkill).toBeDefined();
      expect(recForTestSkill?.skillName).toEqual(testSkill.name);
      expect(recForTestSkill?.score).toBeLessThan(500); // Score should be lower due to incorrect answer
      expect(recForTestSkill?.priority).toBeDefined();
      expect(recForTestSkill?.explanation).toBeDefined();
      expect(recForTestSkill?.resources).toBeDefined();
      expect(recForTestSkill?.resources[0].id).toBeDefined();
      expect(recForTestSkill?.resources[0].title).toBeDefined();
      
      // Check if history was saved (optional but good)
      const history = await historyRepository.find({ where: { user: { id: testUser.id }, skill: { id: testSkill.id }} });
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].resource.id).toEqual(recForTestSkill?.resources[0].id);
  });
  
  // TODO: Add tests for different recommendation scenarios
  // - User performs perfectly (no recommendations?)
  // - User has multiple skill gaps
  // - Requesting recommendations for a specific skill ID
  // - Requesting different resource types

}); 