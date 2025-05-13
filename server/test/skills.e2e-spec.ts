// import * as dotenv from 'dotenv'; // Remove
// dotenv.config(); // Remove

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Skill, SkillStatus } from '../src/entities/skill.entity';
import { User } from '../src/entities/user.entity';
import { AuthService } from '../src/auth.service';
import { CreateSkillDto, UpdateSkillDto } from '../src/dto/create-skill.dto';
import { Role } from '../src/role.enum';
import { setupTestApp, loginAndGetToken, adminCredentials, studentCredentials } from './utils/e2e-setup';

describe('SkillsController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let skillRepository: Repository<Skill>;
  let userRepository: Repository<User>;
  let authService: AuthService;
  let adminToken: string;
  let userToken: string;
  let testSkill: Skill;

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
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    authService = moduleFixture.get<AuthService>(AuthService);

    // Clean up potential existing test data
    await skillRepository.query('DELETE FROM skill WHERE name LIKE \'%E2E Skill Test%\';');
    await userRepository.delete({ email: adminCredentials.email });
    await userRepository.delete({ email: studentCredentials.email });

    // Create test users
    try {
        await authService.register(adminCredentials);
        await authService.register(studentCredentials);
    } catch (error) {
        console.warn('Test users for Skills E2E might already exist:', error.message);
    }

    // Generate JWT tokens
    adminToken = (await authService.login({ email: adminCredentials.email, password: adminCredentials.password })).access_token;
    userToken = (await authService.login({ email: studentCredentials.email, password: studentCredentials.password })).access_token;
  });

  afterAll(async () => {
    // Clean up test data
    await skillRepository.query('DELETE FROM skill WHERE name LIKE \'%E2E Skill Test%\';');
    await userRepository.delete({ email: adminCredentials.email });
    await userRepository.delete({ email: studentCredentials.email });
    
    // Close database connection and app
    if (dataSource?.isInitialized) {
        await dataSource.destroy();
    }
    if (app) { 
        await app.close();
    }
  });

  // Clean skills before each test involving modification/deletion
  beforeEach(async () => {
    await skillRepository.query('DELETE FROM skill WHERE name LIKE \'%E2E Skill Test%\';');
    // Create a sample skill for tests needing an existing one (GET /:id, PATCH, DELETE)
    testSkill = await skillRepository.save({
      name: 'E2E Skill Test - Initial',
      description: 'Initial skill for GET/PATCH/DELETE tests',
      subject: 'E2E Test Subject',
      gradeLevel: 5,
      status: SkillStatus.ACTIVE,
    });
  });

  // --- Test Suites --- 

  describe('POST /skills', () => {
    const createDto: CreateSkillDto = {
      name: 'E2E Skill Test - Create',
      description: 'Created via E2E test',
      subject: 'E2E Subject',
      gradeLevel: 6,
      status: SkillStatus.INACTIVE,
    };

    it('should create a skill (Admin) - 201', () => {
      return request(app.getHttpServer())
        .post('/skills')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createDto)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.name).toEqual(createDto.name);
          expect(res.body.status).toEqual(SkillStatus.INACTIVE);
        });
    });

    it('should fail without authentication - 401', () => {
      return request(app.getHttpServer())
        .post('/skills')
        .send(createDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should fail for non-admin user (Student) - 403', () => {
      return request(app.getHttpServer())
        .post('/skills')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createDto)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should fail with invalid data (missing name) - 400', () => {
      const invalidDto = { ...createDto, name: undefined };
      return request(app.getHttpServer())
        .post('/skills')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail with invalid enum value for status - 400', () => {
        const invalidDto = { ...createDto, status: 'INVALID_STATUS' };
         return request(app.getHttpServer())
            .post('/skills')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(invalidDto)
            .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /skills', () => {
    it('should get all skills (Public/Any Authenticated User) - 200', () => {
      // Ensure testSkill exists from beforeEach
      return request(app.getHttpServer())
        .get('/skills')
        .set('Authorization', `Bearer ${userToken}`) // Test with student token
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(1);
          expect(res.body.some(s => s.id === testSkill.id)).toBe(true);
        });
    });

    it('should get all skills without authentication - 200', () => {
        // Assuming GET /skills is public
        return request(app.getHttpServer())
          .get('/skills')
          .expect(HttpStatus.OK)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      });
  });

  describe('GET /skills/:id', () => {
    it('should get a specific skill by ID (Public/Any Authenticated User) - 200', () => {
      // Add check to ensure testSkill and its id exist before the request
      expect(testSkill).toBeDefined();
      expect(testSkill.id).toBeDefined();
      
      return request(app.getHttpServer())
        .get(`/skills/${testSkill.id}`)
        .set('Authorization', `Bearer ${userToken}`) // Test with student token
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.id).toEqual(testSkill.id);
          expect(res.body.name).toEqual(testSkill.name);
        });
    });
    
    it('should get a specific skill by ID without authentication - 200', () => {
        // Add check to ensure testSkill and its id exist before the request
        expect(testSkill).toBeDefined();
        expect(testSkill.id).toBeDefined();

        // Assuming GET /skills/:id is public
        return request(app.getHttpServer())
          .get(`/skills/${testSkill.id}`)
          .expect(HttpStatus.OK)
          .expect((res) => {
            expect(res.body.id).toEqual(testSkill.id);
          });
      });

    it('should fail if skill ID is not a valid UUID - 400', () => {
      return request(app.getHttpServer())
        .get('/skills/invalid-uuid')
        // .set('Authorization', `Bearer ${userToken}`) // No auth needed if public
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail if skill ID does not exist - 404', () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .get(`/skills/${nonExistentId}`)
        // .set('Authorization', `Bearer ${userToken}`) // No auth needed if public
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /skills/:id', () => {
    const updateDto: UpdateSkillDto = {
      description: 'Updated E2E Skill Description',
      status: SkillStatus.INACTIVE,
    };

    it('should update a skill (Admin) - 200', () => {
      return request(app.getHttpServer())
        .patch(`/skills/${testSkill.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.id).toEqual(testSkill.id);
          expect(res.body.description).toEqual(updateDto.description);
          expect(res.body.status).toEqual(SkillStatus.INACTIVE);
        });
    });

    it('should fail without authentication - 401', () => {
      return request(app.getHttpServer())
        .patch(`/skills/${testSkill.id}`)
        .send(updateDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should fail for non-admin user (Student) - 403', () => {
      return request(app.getHttpServer())
        .patch(`/skills/${testSkill.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateDto)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should fail if skill ID is not a valid UUID - 400', () => {
      return request(app.getHttpServer())
        .patch('/skills/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail with invalid data (e.g., wrong type) - 400', () => {
      const invalidUpdateDto = { ...updateDto, gradeLevel: 'not-a-number' };
      return request(app.getHttpServer())
        .patch(`/skills/${testSkill.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidUpdateDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail if skill ID does not exist - 404', () => {
      const nonExistentId = '11111111-1111-1111-1111-111111111111';
      return request(app.getHttpServer())
        .patch(`/skills/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /skills/:id', () => {
    it('should delete a skill (Admin) - 204', async () => {
      // Use the testSkill created in beforeEach
      await request(app.getHttpServer())
        .delete(`/skills/${testSkill.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NO_CONTENT); // 204

      // Verify it's actually deleted
      const findResult = await skillRepository.findOneBy({ id: testSkill.id });
      expect(findResult).toBeNull();
    });

    it('should fail without authentication - 401', () => {
      return request(app.getHttpServer())
        .delete(`/skills/${testSkill.id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should fail for non-admin user (Student) - 403', () => {
      return request(app.getHttpServer())
        .delete(`/skills/${testSkill.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should fail if skill ID is not a valid UUID - 400', () => {
      return request(app.getHttpServer())
        .delete('/skills/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail if skill ID does not exist - 404', () => {
      const nonExistentId = '22222222-2222-2222-2222-222222222222';
      return request(app.getHttpServer())
        .delete(`/skills/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
}); 