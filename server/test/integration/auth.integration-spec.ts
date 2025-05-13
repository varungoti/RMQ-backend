// import * as dotenv from 'dotenv'; // Remove
// dotenv.config(); // Remove

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module'; // Adjust path as needed
import { DataSource } from 'typeorm';
import { User } from '../../src/entities/user.entity'; // Adjust path

describe('Authentication Flow (Integration)', () => {
  let app: INestApplication;
  let httpServer;
  let dataSource: DataSource; // Store DataSource instance

  // Test user credentials
  const testUser = {
    email: `test-user-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    username: `testuser-${Date.now()}`,
    firstName: 'Test',
    lastName: 'User',
  };
  let accessToken: string;

  beforeAll(async () => {
    // dotenv.config() should ideally be called before module compilation

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Apply the same validation pipe used in main.ts
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    await app.init();
    httpServer = app.getHttpServer();

    // Get DataSource instance for cleanup
    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Clean up test user if it exists from a previous failed run
    try {
      const userRepo = dataSource.getRepository(User);
      const existingUser = await userRepo.findOneBy({ email: testUser.email });
      if (existingUser) {
        await userRepo.delete({ email: testUser.email });
        console.log(`Pre-test cleanup: Removed existing test user ${testUser.email}`);
      }
    } catch (error) {
       console.warn(`Pre-test cleanup failed for ${testUser.email}: ${error?.message ?? error}`);
    }
  });

  afterAll(async () => {
    // Clean up the test user created during the test
    try {
       if (dataSource) {
         const userRepo = dataSource.getRepository(User);
         const deleted = await userRepo.delete({ email: testUser.email });
         if (deleted.affected && deleted.affected > 0) {
             console.log(`Post-test cleanup: Removed test user ${testUser.email}`);
         } else {
             console.log(`Post-test cleanup: Test user ${testUser.email} not found for removal.`);
         }
       } else {
         console.warn('Post-test cleanup: DataSource not available.');
       }
    } catch (error) {
        console.error(`Error during post-test cleanup for ${testUser.email}: ${error?.message ?? error}`);
    }

    if (app) {
        await app.close();
    }
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
    expect(httpServer).toBeDefined();
    expect(dataSource).toBeDefined();
  });

  // Test Sequence:
  // 1. /auth/signup (POST)
  // 2. /auth/login (POST)
  // 3. /auth/profile (GET with Bearer Token)

  describe('POST /auth/signup', () => {
    it('should register a new user successfully', async () => {
      return request(httpServer)
        .post('/auth/register')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201) // Expect HTTP 201 Created
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.email).toEqual(testUser.email);
          expect(res.body.id).toBeDefined();
          expect(res.body.password).toBeUndefined(); // Ensure password is not returned
        });
    });

    it('should fail to register with the same email', async () => {
       return request(httpServer)
        .post('/auth/register')
        .send({
          email: testUser.email, // Same email
          password: 'AnotherPassword123!',
        })
        .expect(409); // Expect HTTP 409 Conflict
    });

    it('should fail with invalid email format', async () => {
       return request(httpServer)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: testUser.password,
        })
        .expect(400); // Expect HTTP 400 Bad Request (due to ValidationPipe)
    });

     it('should fail with weak password', async () => {
       return request(httpServer)
        .post('/auth/register')
        .send({
          email: `weakpass-${Date.now()}@example.com`,
          password: 'weak', // Password too short/simple
        })
        .expect(400); // Expect HTTP 400 Bad Request (due to ValidationPipe)
    });
    
    // Add more validation tests (missing fields, etc.) if needed
  });

  describe('POST /auth/login', () => {
    it('should login the registered user and return an access token', async () => {
       return request(httpServer)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200) // Expect HTTP 200 OK
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.access_token).toBeDefined();
          expect(typeof res.body.access_token).toBe('string');
          accessToken = res.body.access_token; // Store token for next test
        });
    });

    it('should fail login with incorrect password', async () => {
       return request(httpServer)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword!',
        })
        .expect(401); // Expect HTTP 401 Unauthorized
    });

    it('should fail login with non-existent email', async () => {
      return request(httpServer)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect(401); // Expect HTTP 401 Unauthorized
    });
  });

  describe('GET /users/profile', () => {
    it('should return the user profile for a logged-in user', async () => {
      expect(accessToken).toBeDefined(); // Ensure token was obtained
      return request(httpServer)
        .get('/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.email).toEqual(testUser.email);
          expect(res.body.id).toBeDefined();
          expect(res.body.password).toBeUndefined(); // Ensure password is not returned
        });
    });

    it('should fail to return profile without authentication token', async () => {
       return request(httpServer)
        .get('/users/profile')
        .expect(401); // Expect HTTP 401 Unauthorized
    });

    it('should fail to return profile with invalid/expired token', async () => {
      return request(httpServer)
        .get('/users/profile')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401); // Expect HTTP 401 Unauthorized
    });
  });

}); 