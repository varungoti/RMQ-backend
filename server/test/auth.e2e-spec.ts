import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { AuthModule } from './../src/auth.module'; // Explicitly import AuthModule
import { CreateUserDto } from './../src/dto/create-user.dto';
import { User, UserRole } from './../src/entities/user.entity';
import { RolesGuard } from './../src/guards/roles.guard'; // Corrected import path for RolesGuard
import { DataSource } from 'typeorm'; // Import DataSource

// Note: E2E tests often benefit from a dedicated test database or advanced mocking strategies
// For now, we'll focus on the request/response flow and assume underlying services work (or use simple mocks if needed)

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource; // Declare dataSource

  // Mock data for requests
  const registerDto: CreateUserDto = {
    email: `e2e-test-${Date.now()}@example.com`, // Use unique email for each run
    password: 'password123',
    gradeLevel: 5, // Added required field
  };

  const loginDto = {
    email: registerDto.email,
    password: registerDto.password,
  };

  beforeAll(async () => {
    // Create a testing module that imports the main AppModule and AuthModule
    // This typically spins up a significant portion of your actual application
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, AuthModule], // Import your main application module and AuthModule
    })
    // Mock RolesGuard to always allow access for these tests
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: () => true })
    .compile();

    app = moduleFixture.createNestApplication();
    
    // Apply same global pipes/interceptors as in main.ts for consistency
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
    }));
    
    await app.init();
    // Get services/repositories
    dataSource = moduleFixture.get<DataSource>(DataSource); // Get dataSource instance
  });

  afterAll(async () => {
    // Close database connection and app
    if (dataSource?.isInitialized) {
        await dataSource.destroy();
    }
    if (app) { 
        await app.close();
    }
  });

  it('/auth/register (POST) - should register a new user', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto)
      .expect(201) // Expect HTTP status 201 Created
      .expect((res) => {
        // Basic checks on the response body
        expect(res.body).toBeDefined();
        expect(res.body.id).toBeDefined();
        expect(res.body.email).toEqual(registerDto.email);
        expect(res.body.role).toEqual(UserRole.STUDENT); // Check default role
        expect(res.body.gradeLevel).toBeDefined(); // Check if gradeLevel is returned
        expect(res.body.passwordHash).toBeUndefined(); // Ensure hash is NOT returned
      });
  });

  it('/auth/register (POST) - should fail if email already exists', () => {
    // Attempt to register the same user again
    return request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto)
      .expect(409); // Expect HTTP status 409 Conflict
  });

  it('/auth/login (POST) - should login the registered user and return JWT', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send(loginDto)
      .expect(200) // Corrected expected status code from 201 to 200
      .expect((res) => {
        expect(res.body).toBeDefined();
        expect(res.body.access_token).toBeDefined();
        expect(res.body.access_token).toMatch(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/); // Basic JWT format check
      });
  });

  it('/auth/login (POST) - should fail with wrong password', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ ...loginDto, password: 'wrongpassword' })
      .expect(401); // Expect HTTP status 401 Unauthorized
  });

  it('/auth/login (POST) - should fail with non-existent email', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nosuchuser@example.com', password: 'password123' })
      .expect(401); // Expect HTTP status 401 Unauthorized
  });

  // --- Refresh Token Tests --- 
  describe('/auth/refresh (POST)', () => {
    let currentAccessToken: string;
    let currentRefreshToken: string;

    // 1. Login before running refresh tests to get initial tokens
    // Use the same login details as other tests
    beforeAll(async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto);
      expect(loginRes.status).toBe(200);
      currentAccessToken = loginRes.body.access_token;
      currentRefreshToken = loginRes.body.refresh_token;
      expect(currentAccessToken).toBeDefined();
      expect(currentRefreshToken).toBeDefined();
    });

    it('should return a new access token with a valid refresh token', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Ensure time passes
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${currentRefreshToken}`) // Use Refresh Token
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.access_token).toBeDefined();
          expect(res.body.access_token).not.toEqual(currentAccessToken); // Ensure it's a NEW token
          expect(res.body.access_token).toMatch(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/);
        });
    });

    it('should fail (401) if using an access token instead of a refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${currentAccessToken}`) // Use Access Token (incorrect)
        .expect(401);
    });

    it('should fail (401) if using an invalid/malformed token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should fail (401) if no token is provided', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .expect(401);
    });
  }); // End describe /auth/refresh

  // Protected Route Access tests (already present, should be fine)
  describe('Protected Route Access', () => {
    let initialAccessToken: string;
    let initialRefreshToken: string;
    let refreshedAccessToken: string;

    // Login and Refresh once before these tests
    beforeAll(async () => {
      // 1. Login
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto);
      expect(loginRes.status).toBe(200);
      initialAccessToken = loginRes.body.access_token;
      initialRefreshToken = loginRes.body.refresh_token;
      expect(initialAccessToken).toBeDefined();
      expect(initialRefreshToken).toBeDefined();

      // 2. Refresh
      await new Promise(resolve => setTimeout(resolve, 1000)); // Ensure time passes
      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${initialRefreshToken}`);
      expect(refreshRes.status).toBe(200);
      refreshedAccessToken = refreshRes.body.access_token;
      expect(refreshedAccessToken).toBeDefined();
      expect(refreshedAccessToken).not.toEqual(initialAccessToken);
    });

    it('should access a protected route with INITIAL valid JWT', () => {
      return request(app.getHttpServer())
        .get('/users') // Replace with actual protected route if different
        .set('Authorization', `Bearer ${initialAccessToken}`)
        .expect(200);
    });
    
    it('should access a protected route with REFRESHED valid JWT', () => {
      return request(app.getHttpServer())
        .get('/users') // Use the same protected route
        .set('Authorization', `Bearer ${refreshedAccessToken}`)
        .expect(200);
    });

    it('should fail to access protected route without JWT', () => {
      return request(app.getHttpServer())
        .get('/users') 
        .expect(401);
    });

    it('should fail to access protected route with invalid JWT', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer invalidtoken`)
        .expect(401);
    });
    
    // Optional: Test if the INITIAL access token still works after refresh (it shouldn't if stateless)
    // Optional: Test if the REFRESH token can access the protected route (it shouldn't)
  });

}); 