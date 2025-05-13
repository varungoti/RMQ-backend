// import * as dotenv from 'dotenv'; // Remove
// dotenv.config(); // Remove

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource, Repository, In } from 'typeorm';
import { User, UserRole } from '../../src/entities/user.entity';
import { Skill } from '../../src/entities/skill.entity';
import { Question, QuestionType } from '../../src/entities/question.entity';

describe('Admin CRUD Flows (Integration)', () => {
  let app: INestApplication;
  let httpServer;
  let dataSource: DataSource;
  let userRepository: Repository<User>;
  let skillRepository: Repository<Skill>;
  let questionRepository: Repository<Question>;

  let adminUser: User;
  let regularUser: User; // For testing authorization
  let adminToken: string;
  let userToken: string; // Non-admin user token

  let createdSkillId: string;
  let createdQuestionId: string;

  const adminCredentials = {
    email: `admin-${Date.now()}@example.com`,
    password: 'AdminPassword123!',
    // username: `admin-${Date.now()}`, // Remove if not in DTO
    // firstName: 'Admin', // Remove if not in DTO
    // lastName: 'User', // Remove if not in DTO
    role: UserRole.ADMIN,
    gradeLevel: 0, // Add required gradeLevel (e.g., 0 for admin/teacher)
  };

  const userCredentials = {
    email: `reg-user-${Date.now()}@example.com`,
    password: 'UserPassword123!',
    // username: `reg-user-${Date.now()}`, // Remove if not in DTO
    // firstName: 'Regular', // Remove if not in DTO
    // lastName: 'User', // Remove if not in DTO
    role: UserRole.STUDENT,
    gradeLevel: 5, // Add required gradeLevel
  };

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

    // --- Test Data Setup ---
    // Clean previous users
    await userRepository.delete({ email: adminCredentials.email });
    await userRepository.delete({ email: userCredentials.email });
    // Clean potential leftover skills/questions from previous runs if needed

    // 1. Create Admin User
    const adminSignup = await request(httpServer).post('/auth/register').send(adminCredentials).expect(HttpStatus.CREATED);
    adminUser = adminSignup.body;

    // 2. Create Regular User
    const userSignup = await request(httpServer).post('/auth/register').send(userCredentials).expect(HttpStatus.CREATED);
    regularUser = userSignup.body;

    // 3. Login Admin
    adminToken = (await request(httpServer).post('/auth/login').send({ email: adminCredentials.email, password: adminCredentials.password }).expect(HttpStatus.OK)).body.access_token;
    
    // 4. Login Regular User
    userToken = (await request(httpServer).post('/auth/login').send({ email: userCredentials.email, password: userCredentials.password }).expect(HttpStatus.OK)).body.access_token;

    expect(adminUser).toBeDefined();
    expect(regularUser).toBeDefined();
    expect(adminToken).toBeDefined();
    expect(userToken).toBeDefined();
  }, 20000); // Increase timeout

  afterAll(async () => {
    try {
      // Clean up created resources
      if (createdQuestionId) await questionRepository.delete({ id: createdQuestionId });
      if (createdSkillId) await skillRepository.delete({ id: createdSkillId });
      // Clean up users
      if (adminUser) await userRepository.delete({ id: adminUser.id });
      if (regularUser) await userRepository.delete({ id: regularUser.id });
      console.log('Cleaned up admin CRUD test data.');
    } catch (error) {
        console.error(`Error during admin CRUD test cleanup: ${error?.message ?? error}`);
    }
    
    if (app) {
        await app.close();
    }
  }, 20000); // Increase timeout

  // --- Skills CRUD --- 
  describe('Skills CRUD (Admin)', () => {
      const skillData = { 
          name: 'Admin Test Skill', 
          subject: 'Integration Test Skill Subject',
          gradeLevel: 7,
          description: 'Created via admin test' 
      };
      const skillUpdateData = { description: 'Updated via admin test' };

      it('[POST /skills] should FAIL for non-admin user', async () => {
          return request(httpServer)
              .post('/skills')
              .set('Authorization', `Bearer ${userToken}`) // Regular user token
              .send(skillData)
              .expect(HttpStatus.FORBIDDEN);
      });

      it('[POST /skills] should CREATE a skill for admin user', async () => {
          const response = await request(httpServer)
              .post('/skills')
              .set('Authorization', `Bearer ${adminToken}`) // Admin token
              .send(skillData)
              .expect(HttpStatus.CREATED);
          
          expect(response.body).toBeDefined();
          expect(response.body.id).toBeDefined();
          createdSkillId = response.body.id;
          expect(response.body.name).toEqual(skillData.name);
      });

      it('[GET /skills/:id] should retrieve the created skill', async () => {
          expect(createdSkillId).toBeDefined();
          return request(httpServer)
              .get(`/skills/${createdSkillId}`)
              .set('Authorization', `Bearer ${userToken}`) // Allow any logged-in user to read
              .expect(HttpStatus.OK)
              .expect((res) => {
                  expect(res.body.id).toEqual(createdSkillId);
                  expect(res.body.name).toEqual(skillData.name);
              });
      });

      it('[PATCH /skills/:id] should FAIL for non-admin user', async () => {
          expect(createdSkillId).toBeDefined();
          return request(httpServer)
              .patch(`/skills/${createdSkillId}`)
              .set('Authorization', `Bearer ${userToken}`) // Regular user token
              .send(skillUpdateData)
              .expect(HttpStatus.FORBIDDEN);
      });

      it('[PATCH /skills/:id] should UPDATE the skill for admin user', async () => {
          expect(createdSkillId).toBeDefined();
          return request(httpServer)
              .patch(`/skills/${createdSkillId}`)
              .set('Authorization', `Bearer ${adminToken}`) // Admin token
              .send(skillUpdateData)
              .expect(HttpStatus.OK)
              .expect((res) => {
                  expect(res.body.id).toEqual(createdSkillId);
                  expect(res.body.description).toEqual(skillUpdateData.description);
              });
      });

       it('[DELETE /skills/:id] should FAIL for non-admin user', async () => {
          expect(createdSkillId).toBeDefined();
          return request(httpServer)
              .delete(`/skills/${createdSkillId}`)
              .set('Authorization', `Bearer ${userToken}`) // Regular user token
              .expect(HttpStatus.FORBIDDEN);
      });

      it('[DELETE /skills/:id] should DELETE the skill for admin user', async () => {
          expect(createdSkillId).toBeDefined();
          await request(httpServer)
              .delete(`/skills/${createdSkillId}`)
              .set('Authorization', `Bearer ${adminToken}`) // Admin token
              .expect(HttpStatus.NO_CONTENT); // Changed from OK to NO_CONTENT
              
          // Verify deletion
          await request(httpServer)
              .get(`/skills/${createdSkillId}`)
              .set('Authorization', `Bearer ${userToken}`)
              .expect(HttpStatus.NOT_FOUND);
              
          createdSkillId = ""; // Clear ID after deletion
      });
  });

  // --- Questions CRUD (Requires a Skill) --- 
  describe('Questions CRUD (Admin)', () => {
      let tempSkill: Skill; // Need a skill to associate questions with
      const questionData = { 
          questionText: 'Admin Q Test?', 
          questionType: QuestionType.MCQ,
          options: { A: '1', B: '2' },
          correctAnswer: 'B',
          difficultyLevel: 3,
          gradeLevel: 6,
          primarySkillId: '' // Will be set in beforeAll of this describe block
      };
      const questionUpdateData = { difficultyLevel: 4 };

      beforeAll(async () => {
          // Create a temporary skill for these tests
          tempSkill = await skillRepository.save(skillRepository.create({
            name: `Temp Skill ${Date.now()}`,
            description: 'Temp for Q tests',
            subject: 'Integration Test',
            gradeLevel: 6, // Add required gradeLevel
          }));
          questionData.primarySkillId = tempSkill.id;
      });

      afterAll(async () => {
          // Clean up the temporary skill
          if (tempSkill) await skillRepository.delete({ id: tempSkill.id });
      });

      it('[POST /questions] should FAIL for non-admin user', async () => {
          return request(httpServer)
              .post('/questions')
              .set('Authorization', `Bearer ${userToken}`) // Regular user token
              .send(questionData)
              .expect(HttpStatus.FORBIDDEN);
      });

      it('[POST /questions] should CREATE a question for admin user', async () => {
          const response = await request(httpServer)
              .post('/questions')
              .set('Authorization', `Bearer ${adminToken}`) // Admin token
              .send(questionData)
              .expect(HttpStatus.CREATED);
          
          expect(response.body).toBeDefined();
          expect(response.body.id).toBeDefined();
          createdQuestionId = response.body.id;
          expect(response.body.questionText).toEqual(questionData.questionText);
          expect(response.body.primarySkill.id).toEqual(tempSkill.id);
      });

      // Add tests for GET /questions/:id, PATCH /questions/:id, DELETE /questions/:id similar to skills
      // Remember to test authorization failures for PATCH and DELETE with userToken

      it('[GET /questions/:id] should retrieve the created question', async () => {
           expect(createdQuestionId).toBeDefined();
           // Any logged-in user should be able to read
           return request(httpServer)
               .get(`/questions/${createdQuestionId}`)
               .set('Authorization', `Bearer ${userToken}`) 
               .expect(HttpStatus.OK)
               .expect((res) => {
                   expect(res.body.id).toEqual(createdQuestionId);
                   expect(res.body.questionText).toEqual(questionData.questionText);
               });
       });

       it('[PATCH /questions/:id] should FAIL for non-admin user', async () => {
           expect(createdQuestionId).toBeDefined();
           return request(httpServer)
               .patch(`/questions/${createdQuestionId}`)
               .set('Authorization', `Bearer ${userToken}`) 
               .send(questionUpdateData)
               .expect(HttpStatus.FORBIDDEN);
       });

       it('[PATCH /questions/:id] should UPDATE the question for admin user', async () => {
           expect(createdQuestionId).toBeDefined();
           return request(httpServer)
               .patch(`/questions/${createdQuestionId}`)
               .set('Authorization', `Bearer ${adminToken}`) 
               .send(questionUpdateData)
               .expect(HttpStatus.OK)
               .expect((res) => {
                   expect(res.body.id).toEqual(createdQuestionId);
                   expect(res.body.difficultyLevel).toEqual(questionUpdateData.difficultyLevel);
               });
       });

       it('[DELETE /questions/:id] should FAIL for non-admin user', async () => {
           expect(createdQuestionId).toBeDefined();
           return request(httpServer)
               .delete(`/questions/${createdQuestionId}`)
               .set('Authorization', `Bearer ${userToken}`) 
               .expect(HttpStatus.FORBIDDEN);
       });

       it('[DELETE /questions/:id] should DELETE the question for admin user', async () => {
           expect(createdQuestionId).toBeDefined();
           await request(httpServer)
               .delete(`/questions/${createdQuestionId}`)
               .set('Authorization', `Bearer ${adminToken}`) 
               .expect(HttpStatus.NO_CONTENT); // Changed from OK to NO_CONTENT
               
           // Verify deletion
           await request(httpServer)
               .get(`/questions/${createdQuestionId}`)
               .set('Authorization', `Bearer ${userToken}`)
               .expect(HttpStatus.NOT_FOUND);
               
           createdQuestionId = ""; // Clear ID
       });

  });

  // --- Users Read/Update (Admin) --- 
  describe('Users Read/Update (Admin)', () => {
      // Admin should be able to list users and potentially update roles/status
      // Note: Deleting users might be restricted or require careful handling

      it('[GET /users] should FAIL for non-admin user', async () => {
         return request(httpServer)
              .get('/users')
              .set('Authorization', `Bearer ${userToken}`) 
              .expect(HttpStatus.FORBIDDEN);
      });

      it('[GET /users] should LIST users for admin user', async () => {
          return request(httpServer)
              .get('/users')
              .set('Authorization', `Bearer ${adminToken}`) 
              .expect(HttpStatus.OK)
              .expect((res) => {
                  expect(res.body).toBeInstanceOf(Array);
                  expect(res.body.length).toBeGreaterThanOrEqual(2); // Admin + regular user
                  expect(res.body.some(u => u.id === adminUser.id)).toBe(true);
                  expect(res.body.some(u => u.id === regularUser.id)).toBe(true);
              });
      });
      
      // Add tests for GET /users/:id (Admin reading specific user)
      it('[GET /users/:id] should retrieve a specific user for admin', async () => {
           expect(regularUser.id).toBeDefined();
           return request(httpServer)
               .get(`/users/${regularUser.id}`)
               .set('Authorization', `Bearer ${adminToken}`) 
               .expect(HttpStatus.OK)
               .expect((res) => {
                   expect(res.body.id).toEqual(regularUser.id);
                   expect(res.body.email).toEqual(userCredentials.email);
               });
       });
       
      // Add tests for PATCH /users/:id (Admin updating user - e.g., role, but be careful)
      // Example: Changing role (use with caution in tests)
      /*
      it('[PATCH /users/:id] should UPDATE user role for admin', async () => {
          expect(regularUser.id).toBeDefined();
          return request(httpServer)
              .patch(`/users/${regularUser.id}`)
              .set('Authorization', `Bearer ${adminToken}`)
              .send({ role: UserRole.TEACHER })
              .expect(HttpStatus.OK)
              .expect((res) => {
                  expect(res.body.id).toEqual(regularUser.id);
                  expect(res.body.role).toEqual(UserRole.TEACHER);
              });
      });
      */
      
       // Add tests for DELETE /users/:id (Admin deleting user - ensure DELETE endpoint exists and is guarded)
       it('[DELETE /users/:id] should FAIL for non-admin user', async () => {
           expect(regularUser.id).toBeDefined();
           return request(httpServer)
               .delete(`/users/${regularUser.id}`)
               .set('Authorization', `Bearer ${userToken}`)
               .expect(HttpStatus.FORBIDDEN);
       });
       
       // Assuming DELETE /users/:id is implemented and guarded for ADMIN
       /*
       it('[DELETE /users/:id] should DELETE a user for admin', async () => {
            expect(regularUser.id).toBeDefined();
            await request(httpServer)
                .delete(`/users/${regularUser.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(HttpStatus.OK); // Or 204
            
            // Verify deletion
            await request(httpServer)
                .get(`/users/${regularUser.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(HttpStatus.NOT_FOUND);
                
            // Need to handle cleanup differently if user is deleted here
       });
       */
  });

}); 