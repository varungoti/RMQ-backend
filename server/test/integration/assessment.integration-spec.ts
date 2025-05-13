import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource, Repository, In } from 'typeorm';
import { User, UserRole } from '../../src/entities/user.entity';
import { Skill } from '../../src/entities/skill.entity';
import { Question, QuestionType } from '../../src/entities/question.entity';
import { AssessmentSession } from '../../src/entities/assessment_session.entity';
import { AssessmentResponse } from '../../src/entities/assessment_response.entity';
import { AssessmentSkillScore } from '../../src/entities/assessment_skill_score.entity';
import { GetNextQuestionResponseDto } from '../../src/dto/assessment.dto';

describe('Assessment Flow (Integration)', () => {
  let app: INestApplication;
  let httpServer;
  let dataSource: DataSource;
  let userRepository: Repository<User>;
  let skillRepository: Repository<Skill>;
  let questionRepository: Repository<Question>;
  let sessionRepository: Repository<AssessmentSession>;
  let responseRepository: Repository<AssessmentResponse>;
  let scoreRepository: Repository<AssessmentSkillScore>;

  let testUser: User;
  let testSkill: Skill;
  let testQuestions: Question[] = [];
  let userToken: string;
  let assessmentSessionId: string;
  let currentQuestionId: string | undefined;

  const userCredentials = {
    email: `assess-user-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    username: `assess-user-${Date.now()}`,
    firstName: 'Assess',
    lastName: 'User',
    role: UserRole.STUDENT,
  };

  const testSkillName = 'Integration Test Skill';
  const testQuestionTexts = ['Integration Q1?', 'Integration Q2?'];

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

    // --- Test Data Setup ---
    // Clean previous potentially failed runs
    await userRepository.delete({ email: userCredentials.email });
    await skillRepository.delete({ name: testSkillName });
    await questionRepository.delete({ questionText: In(testQuestionTexts) });
    // Consider cleaning related assessment data if necessary

    // 1. Create User
    const signupResponse = await request(httpServer)
        .post('/auth/signup')
        .send(userCredentials)
        .expect(HttpStatus.CREATED);
    testUser = signupResponse.body;

    // 2. Login User
    const loginResponse = await request(httpServer)
        .post('/auth/login')
        .send({ email: userCredentials.email, password: userCredentials.password })
        .expect(HttpStatus.OK);
    userToken = loginResponse.body.access_token;

    // 3. Create Skill
    testSkill = await skillRepository.save(
        skillRepository.create({ name: testSkillName, description: 'Skill for integration tests' })
    );

    // 4. Create Questions for the Skill
    const q1 = questionRepository.create({
        questionText: testQuestionTexts[0],
        questionType: QuestionType.MCQ,
        options: { A: 'Option A', B: 'Option B', C: 'Option C'},
        correctAnswer: 'A',
        difficultyLevel: 1,
        gradeLevel: 5,
        primarySkill: testSkill,
    });
    const q2 = questionRepository.create({
        questionText: testQuestionTexts[1],
        questionType: QuestionType.MCQ,
        options: { '1': 'Option 1', '2': 'Option 2', '3': 'Option 3'},
        correctAnswer: '2',
        difficultyLevel: 2,
        gradeLevel: 5,
        primarySkill: testSkill,
    });
    testQuestions = await questionRepository.save([q1, q2]);

    expect(testUser).toBeDefined();
    expect(userToken).toBeDefined();
    expect(testSkill).toBeDefined();
    expect(testQuestions).toHaveLength(2);
  });

  afterAll(async () => {
    // Clean up test data
    try {
      // Delete in reverse order of creation/dependency
      if (assessmentSessionId) {
          const session = await sessionRepository.findOne({ 
              where: { id: assessmentSessionId }, 
              relations: ['responses'] 
          });
          if (session) {
              if (session.responses?.length > 0) await responseRepository.remove(session.responses);
              // Remove any skill scores associated with this session's user and skill
              if (session.user?.id && session.skill?.id) {
                  await scoreRepository.delete({ 
                      user: { id: session.user.id }, 
                      skill: { id: session.skill.id } 
                  });
              }
              await sessionRepository.delete({ id: assessmentSessionId });
              console.log(`Cleaned up assessment session: ${assessmentSessionId}`);
          }
      }
      // Use IDs for deletion if available
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
        console.error(`Error during assessment test cleanup: ${error?.message ?? error}`);
    }
    
    if (app) {
        await app.close();
    }
  });

  it('should start an assessment session and return the first question', async () => {
    const response = await request(httpServer)
        .post('/assessment/start')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.CREATED);
    
    const body = response.body;
    expect(body).toBeDefined();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.id).toBeDefined();
    assessmentSessionId = body.data.id; // Store for subsequent tests
    expect(body.data.questionIds).toBeInstanceOf(Array);
    expect(body.data.questionIds.length).toEqual(testQuestions.length);
    expect(body.data.status).toBeDefined();
    expect(body.data.skill).toBeDefined();
    expect(body.data.user).toBeDefined();
  });

  it('should submit a correct answer for the first question', async () => {
      expect(assessmentSessionId).toBeDefined();
      // First we need to get the first question
      const nextResponse = await request(httpServer)
        .get(`/assessment/session/${assessmentSessionId}/next`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);
      
      expect(nextResponse.body.success).toBe(true);
      expect(nextResponse.body.data).toBeDefined();
      expect(nextResponse.body.data.isComplete).toBe(false);
      expect(nextResponse.body.data.nextQuestion).toBeDefined();
      currentQuestionId = nextResponse.body.data.nextQuestion.id;
      
      const question = testQuestions.find(q => q.id === currentQuestionId);
      expect(question).toBeDefined();
      
      const submitDto = {
        assessmentSessionId: assessmentSessionId,
        questionId: currentQuestionId,
        userResponse: question.correctAnswer
      };
      
      const response = await request(httpServer)
        .post('/assessment/submit')
        .set('Authorization', `Bearer ${userToken}`)
        .send(submitDto)
        .expect(HttpStatus.OK);
        
      const body = response.body;
      expect(body).toBeDefined();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.isCorrect).toBe(true);
      expect(body.isCorrect).toBe(true); // Check backward compatibility property
  });

  it('should get the next question (second question)', async () => {
      expect(assessmentSessionId).toBeDefined();
      const response = await request(httpServer)
        .get(`/assessment/session/${assessmentSessionId}/next`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);
        
      const body = response.body;
      expect(body).toBeDefined();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.isComplete).toBe(false);
      expect(body.data.nextQuestion).toBeDefined();
      expect(body.data.nextQuestion.id).toBeDefined();
      expect(body.data.nextQuestion.id).not.toEqual(currentQuestionId);
      currentQuestionId = body.data.nextQuestion.id;
  });
  
  it('should submit an incorrect answer for the second question', async () => {
      expect(assessmentSessionId).toBeDefined();
      expect(currentQuestionId).toBeDefined();
      const question = testQuestions.find(q => q.id === currentQuestionId);
      expect(question).toBeDefined();
      const correctAnswerKey = question.correctAnswer;
      const incorrectAnswerKey = Object.keys(question.options || {}).find(key => key !== correctAnswerKey) || 'X';

      const submitDto = {
        assessmentSessionId: assessmentSessionId,
        questionId: currentQuestionId,
        userResponse: incorrectAnswerKey
      };

      const response = await request(httpServer)
        .post('/assessment/submit')
        .set('Authorization', `Bearer ${userToken}`)
        .send(submitDto)
        .expect(HttpStatus.OK);
        
      const body = response.body;
      expect(body).toBeDefined();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.isCorrect).toBe(false);
      expect(body.isCorrect).toBe(false); // Check backward compatibility property
  });

  it('should indicate assessment is complete when getting next question', async () => {
      expect(assessmentSessionId).toBeDefined();
      const response = await request(httpServer)
        .get(`/assessment/session/${assessmentSessionId}/next`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK);
        
      const body = response.body;
      expect(body).toBeDefined();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.isComplete).toBe(true);
      expect(body.data.nextQuestion).toBeNull();
      currentQuestionId = undefined; // No more questions
  });

  // TODO: Add tests for edge cases:
  // - Starting assessment when one is already active?
  // - Submitting answer to completed session
  // - Getting next question for completed session (already tested above)
  // - Submitting answer for a question not currently assigned
  // - Accessing session belonging to another user

}); 