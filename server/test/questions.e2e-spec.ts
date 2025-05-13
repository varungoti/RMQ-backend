import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Skill, SkillStatus } from '../src/entities/skill.entity';
import { Question, QuestionType, QuestionStatus } from '../src/entities/question.entity';
import { User, UserRole } from '../src/entities/user.entity';
import { CreateQuestionDto, UpdateQuestionDto } from '../src/dto/question.dto';
import { AuthService } from '../src/auth.service';

describe('QuestionsController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let skillRepository: Repository<Skill>;
  let questionRepository: Repository<Question>;
  let userRepository: Repository<User>;
  let authService: AuthService;
  let adminToken: string;
  let userToken: string;
  let studentToken: string;
  let testSkill: Skill;
  let testSkill2: Skill;
  let testQuestions: Question[] = [];
  let tempSkill: Skill;

  // Sample data
  const adminUser = { email: 'admin_q_e2e@test.com', password: 'password', role: UserRole.ADMIN };
  const regularUser = { email: 'user_q_e2e@test.com', password: 'password', role: UserRole.STUDENT };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    // Get services and repositories
    dataSource = moduleFixture.get<DataSource>(DataSource);
    skillRepository = moduleFixture.get<Repository<Skill>>(getRepositoryToken(Skill));
    questionRepository = moduleFixture.get<Repository<Question>>(getRepositoryToken(Question));
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    authService = moduleFixture.get<AuthService>(AuthService);

    // Clean up potential existing test data
    await questionRepository.delete({});
    await skillRepository.query("DELETE FROM skills WHERE name LIKE '%E2E Test Skill - Questions%';");
    await userRepository.delete({ email: adminUser.email });
    await userRepository.delete({ email: regularUser.email });

    // Create test users
    try {
        await authService.register({ email: adminUser.email, password: adminUser.password, role: adminUser.role, gradeLevel: 0 });
        await authService.register({ email: regularUser.email, password: regularUser.password, role: regularUser.role, gradeLevel: 5 });
    } catch (error) {
        // Ignore if users already exist from previous runs (less ideal but handles CI flakes)
        console.warn('Test users might already exist:', error.message);
    }

    // Generate JWT tokens
    adminToken = (await authService.login({ email: adminUser.email, password: adminUser.password })).access_token;
    userToken = (await authService.login({ email: regularUser.email, password: regularUser.password })).access_token;
    studentToken = (await authService.login({ email: regularUser.email, password: regularUser.password })).access_token;

    // Create a test skill required for questions
    testSkill = await skillRepository.save({
      name: 'E2E Question Skill 1',
      subject: 'E2E Q Subject 1',
      gradeLevel: 5,
      status: SkillStatus.ACTIVE,
    });
    testSkill2 = await skillRepository.save({
      name: 'E2E Question Skill 2',
      subject: 'E2E Q Subject 2',
      gradeLevel: 5,
      status: SkillStatus.ACTIVE,
    });
  }, 30000);

  afterAll(async () => {
     // Clean up test data
     await questionRepository.delete({});
     if (testSkill) {
        await skillRepository.delete({ id: testSkill.id });
     }
     if (testSkill2) {
        await skillRepository.delete({ id: testSkill2.id });
     }
     await userRepository.delete({ email: adminUser.email });
     await userRepository.delete({ email: regularUser.email });
     
     // Close database connection and app
     if (dataSource?.isInitialized) {
        await dataSource.destroy();
     }
     if (app) { 
        await app.close();
     }
  });

  // Use beforeEach to ensure a clean state for tests needing an existing question
  beforeEach(async () => {
    // Clean questions before each test to avoid interference
    await questionRepository.delete({});
    // Create a sample question for tests needing an existing one
    testQuestions = await questionRepository.save([
        {
            questionText: 'Initial E2E Question',
            questionType: QuestionType.SHORT_ANSWER,
            options: {}, // Ensure options is defined, even if empty
            correctAnswer: 'Initial Answer',
            gradeLevel: 5,
            status: QuestionStatus.ACTIVE,
            primarySkill: testSkill, // Associate the skill
        },
        {
            questionText: 'Initial E2E Question 2',
            questionType: QuestionType.SHORT_ANSWER,
            options: {}, // Ensure options is defined, even if empty
            correctAnswer: 'Initial Answer 2',
            gradeLevel: 5,
            status: QuestionStatus.ACTIVE,
            primarySkill: testSkill2, // Associate the skill
        }
    ]);

    // Create a temporary skill for modification/deletion tests
    tempSkill = await skillRepository.save({
        name: `Temp Skill ${Date.now()}`,
        subject: 'Temp Integration Test Subject',
        gradeLevel: 6,
        status: SkillStatus.ACTIVE
    });
  });

  describe('POST /questions', () => {
    let createDto: CreateQuestionDto; // Use let for dynamic assignment

     beforeEach(() => {
        // Re-initialize DTO before each test in this describe block
        // Ensures testSkill.id is available and fresh
        createDto = {
            questionText: 'E2E Test Question?',
            questionType: QuestionType.MCQ,
            options: { choices: ['A', 'B', 'C'], answer: 'B' },
            correctAnswer: 'B',
            difficultyLevel: 300,
            gradeLevel: 5,
            primarySkillId: testSkill.id, // Set dynamically based on created skill
            status: QuestionStatus.DRAFT,
        };
    });

    it.skip('should create a question (Admin) - 201', () => {
      return request(app.getHttpServer())
        .post('/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createDto)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.questionText).toEqual(createDto.questionText);
          // Ensure primarySkill is loaded and its ID matches
          expect(res.body.primarySkill).toBeDefined();
          expect(res.body.primarySkill.id).toEqual(testSkill.id);
          expect(res.body.status).toEqual(QuestionStatus.DRAFT);
        });
    });

    it('should fail without authentication - 401', () => {
      return request(app.getHttpServer())
        .post('/questions')
        .send(createDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should fail for non-admin user (Student) - 403', () => {
      return request(app.getHttpServer())
        .post('/questions')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createDto)
        .expect(HttpStatus.FORBIDDEN);
    });

    it.skip('should fail with invalid data (missing required field) - 400', () => {
      const invalidDto = { ...createDto, questionText: undefined }; 
      return request(app.getHttpServer())
        .post('/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it.skip('should fail if primarySkillId does not exist - 404', () => {
      const dtoWithInvalidSkill = { ...createDto, primarySkillId: '00000000-0000-0000-0000-000000000000' };
      return request(app.getHttpServer())
          .post('/questions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(dtoWithInvalidSkill)
          .expect(HttpStatus.NOT_FOUND); // Service throws NotFoundException
     });

     it.skip('should fail with invalid enum value for questionType - 400', () => {
        const dtoWithInvalidEnum = { ...createDto, questionType: 'INVALID_TYPE' };
        return request(app.getHttpServer())
            .post('/questions')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(dtoWithInvalidEnum)
            .expect(HttpStatus.BAD_REQUEST);
    });

     it.skip('should fail with non-numeric gradeLevel - 400', () => {
        const dtoWithInvalidGrade = { ...createDto, gradeLevel: 'five' };
        return request(app.getHttpServer())
            .post('/questions')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(dtoWithInvalidGrade)
            .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /questions', () => {
    it('should get all questions (Authenticated User) - 200', () => {
      return request(app.getHttpServer())
        .get('/questions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(2); // Should have at least the two from beforeEach
          expect(res.body[0].id).toEqual(testQuestions[0].id);
          expect(res.body[0].primarySkill).toBeDefined(); // Ensure relation is loaded by service
          expect(res.body[0].primarySkill.id).toEqual(testSkill.id);
          expect(res.body[1].id).toEqual(testQuestions[1].id);
          expect(res.body[1].primarySkill).toBeDefined(); // Ensure relation is loaded by service
          expect(res.body[1].primarySkill.id).toEqual(testSkill2.id);
        });
    });

    it('should fail without authentication - 401', () => {
      return request(app.getHttpServer())
        .get('/questions')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return an empty array if no questions exist - 200', async () => {
        await questionRepository.delete({});
        return request(app.getHttpServer())
            .get('/questions')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(HttpStatus.OK)
            .expect((res) => {
                expect(Array.isArray(res.body)).toBe(true);
                expect(res.body.length).toBe(0);
            });
    });
  });

  describe('GET /questions/:id', () => {
    it('should get a specific question by ID (Authenticated User) - 200', () => {
      return request(app.getHttpServer())
        .get(`/questions/${testQuestions[0].id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.id).toEqual(testQuestions[0].id);
          expect(res.body.questionText).toEqual(testQuestions[0].questionText);
          expect(res.body.primarySkill).toBeDefined();
          expect(res.body.primarySkill.id).toEqual(testSkill.id);
        });
    });

    it('should fail without authentication - 401', () => {
      return request(app.getHttpServer())
        .get(`/questions/${testQuestions[0].id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should fail if question ID is not a valid UUID - 400', () => {
      return request(app.getHttpServer())
        .get('/questions/invalid-uuid')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail if question ID does not exist - 404', () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .get(`/questions/${nonExistentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /questions/:id', () => {
    let updateDto: UpdateQuestionDto;

    beforeEach(() => {
        updateDto = {
            questionText: 'Updated E2E Question Text',
            status: QuestionStatus.RETIRED,
        };
    });

    it.skip('should update a question (Admin) - 200', () => {
      return request(app.getHttpServer())
        .patch(`/questions/${testQuestions[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.id).toEqual(testQuestions[0].id);
          expect(res.body.questionText).toEqual(updateDto.questionText);
          expect(res.body.status).toEqual(updateDto.status);
        });
    });

    it('should fail without authentication - 401', () => {
      return request(app.getHttpServer())
        .patch(`/questions/${testQuestions[0].id}`)
        .send(updateDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should fail for non-admin user (Student) - 403', () => {
      return request(app.getHttpServer())
        .patch(`/questions/${testQuestions[0].id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateDto)
        .expect(HttpStatus.FORBIDDEN);
    });

    it.skip('should fail if question ID is not a valid UUID - 400', () => {
      return request(app.getHttpServer())
        .patch('/questions/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it.skip('should fail with invalid data (e.g., wrong type) - 400', () => {
      const invalidUpdateDto = { difficultyLevel: 'very hard' }; 
      return request(app.getHttpServer())
            .patch(`/questions/${testQuestions[0].id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(invalidUpdateDto)
            .expect(HttpStatus.BAD_REQUEST); 
    });

    it.skip('should fail if question ID does not exist - 404', () => {
      const nonExistentId = '11111111-1111-1111-1111-111111111111';
      return request(app.getHttpServer())
            .patch(`/questions/${nonExistentId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updateDto)
            .expect(HttpStatus.NOT_FOUND);
    });

     it.skip('should fail if updating to a non-existent primarySkillId - 404', async () => {
        const invalidSkillUpdateDto = { primarySkillId: '22222222-2222-2222-2222-222222222222' };
        return request(app.getHttpServer())
            .patch(`/questions/${testQuestions[0].id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(invalidSkillUpdateDto)
            .expect(HttpStatus.NOT_FOUND); 
     });

      it.skip('should allow partial updates (only text) - 200', () => {
        const partialUpdate = { questionText: 'Updated Text Only' };
        return request(app.getHttpServer())
            .patch(`/questions/${testQuestions[0].id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(partialUpdate)
            .expect(HttpStatus.OK)
            .expect((res) => {
                expect(res.body.questionText).toEqual(partialUpdate.questionText);
                expect(res.body.status).toEqual(testQuestions[0].status); // Status should remain unchanged (was ACTIVE)
            });
    });
  });

  describe('DELETE /questions/:id', () => {
    let questionToDelete: Question; // Define here to be accessible in tests

    // Create a fresh question specifically for delete tests in beforeEach
    beforeEach(async () => {
        await questionRepository.delete({}); // Clear existing first
        questionToDelete = await questionRepository.save({
            questionText: 'Question To Be Deleted',
            questionType: QuestionType.TRUE_FALSE,
            options: {},
            correctAnswer: 'True',
            gradeLevel: 2,
            primarySkill: testSkill,
        });
    });

    it.skip('should delete a question (Admin) - 204', async () => {
      await request(app.getHttpServer())
        .delete(`/questions/${questionToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NO_CONTENT); // 204

      // Verify it's actually deleted by trying to fetch it
      const findResult = await questionRepository.findOneBy({ id: questionToDelete.id });
      expect(findResult).toBeNull();

      // Also verify using the API endpoint
      return request(app.getHttpServer())
          .get(`/questions/${questionToDelete.id}`)
          .expect(HttpStatus.NOT_FOUND);
    });

    it('should fail without authentication - 401', () => {
      return request(app.getHttpServer())
        .delete(`/questions/${questionToDelete.id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should fail for non-admin user - 403', () => {
      return request(app.getHttpServer())
        .delete(`/questions/${questionToDelete.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it.skip('should fail if question ID is not a valid UUID - 400', () => {
      return request(app.getHttpServer())
        .delete('/questions/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it.skip('should fail if question ID does not exist - 404', () => {
      const nonExistentId = '22222222-2222-2222-2222-222222222222';
      return request(app.getHttpServer())
            .delete(`/questions/${nonExistentId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(HttpStatus.NOT_FOUND);
    });
  });
});