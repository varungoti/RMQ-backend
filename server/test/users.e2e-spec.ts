import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User, UserRole } from '../src/entities/user.entity';
import { AuthService } from '../src/auth.service';
import { CreateUserDto } from '../src/dto/create-user.dto';
import { UpdateUserDto } from '../src/dto/update-user.dto';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let authService: AuthService;
  let dataSource: DataSource;
  let adminToken: string;
  let studentToken: string;
  let adminUser: User;
  let studentUser: User;
  let jwtService: JwtService;
  const adminUserId = '00000000-0000-0000-0000-000000000001';

  // Sample Credentials (Restore)
  const adminCredentials = { email: 'admin_user_e2e@test.com', password: 'password', role: UserRole.ADMIN, gradeLevel: 0 };
  const studentCredentials = { email: 'student_user_e2e@test.com', password: 'password', role: UserRole.STUDENT, gradeLevel: 5 };
  const studentToCreateCredentials = { email: 'student_create_e2e@test.com', password: 'password', role: UserRole.STUDENT, gradeLevel: 6 };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    // Get services and repositories
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    authService = moduleFixture.get<AuthService>(AuthService);
    dataSource = moduleFixture.get<DataSource>(DataSource);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Clean up potential existing test data (Restore)
    await userRepository.delete({ email: adminCredentials.email });
    await userRepository.delete({ email: studentCredentials.email });
    await userRepository.delete({ email: studentToCreateCredentials.email });

    // Create initial test users (Restore)
     try {
         adminUser = await authService.register(adminCredentials) as User;
     } catch (error) { 
         console.warn('Admin user for Users E2E might already exist');
         adminUser = await userRepository.findOneByOrFail({email: adminCredentials.email});
      }
      try {
         studentUser = await authService.register(studentCredentials) as User;
      } catch (error) {
         console.warn('Student user for Users E2E might already exist');
         studentUser = await userRepository.findOneByOrFail({email: studentCredentials.email});
      }

    // Generate JWT tokens (Restore)
    adminToken = (await authService.login({ email: adminCredentials.email, password: adminCredentials.password })).access_token;
    studentToken = (await authService.login({ email: studentCredentials.email, password: studentCredentials.password })).access_token;
  });

  afterAll(async () => {
     // Clean up all created test users (Restore)
     await userRepository.delete({ email: adminCredentials.email });
     await userRepository.delete({ email: studentCredentials.email });
     await userRepository.delete({ email: studentToCreateCredentials.email });
     
    // Close database connection and app
    if (dataSource?.isInitialized) {
        await dataSource.destroy();
    }
    if (app) { 
        await app.close();
    }
  });

  // --- Test Suites --- 

  describe('POST /users', () => {
    const createDto: CreateUserDto = {
        email: studentToCreateCredentials.email,
        password: studentToCreateCredentials.password,
        role: studentToCreateCredentials.role,
        gradeLevel: studentToCreateCredentials.gradeLevel,
    };

    it('should create a new user (Public Registration) - 201', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send(createDto)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.email).toEqual(createDto.email);
          expect(res.body.role).toEqual(UserRole.STUDENT);
          expect(res.body.passwordHash).toBeUndefined();
        });
    });

    it('should fail to create user with existing email - 409', () => {
      const conflictDto = { ...createDto, email: studentCredentials.email }; 
      return request(app.getHttpServer())
        .post('/users')
        .send(conflictDto)
        .expect(HttpStatus.CONFLICT);
    });

    it('should fail with invalid data (missing password) - 400', () => {
        const invalidDto = { ...createDto, password: undefined };
        return request(app.getHttpServer())
            .post('/users')
            .send(invalidDto)
            .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /users (Admin)', () => {
    it('should get all users (Admin) - 200', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(2);
          expect(res.body.some(u => u.id === adminUser.id)).toBe(true);
          expect(res.body.some(u => u.id === studentUser.id)).toBe(true);
          expect(res.body[0].passwordHash).toBeUndefined();
        });
    });

    it('should fail GET /users without authentication - 401', () => {
        return request(app.getHttpServer())
            .get('/users')
            .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should fail GET /users for non-admin user (Student) - 403', () => {
        return request(app.getHttpServer())
            .get('/users')
            .set('Authorization', `Bearer ${studentToken}`)
            .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('GET /users/:id (Admin)', () => {
     it.skip('should get a specific user by ID (Admin) - 200', () => {
      return request(app.getHttpServer())
        .get(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.id).toEqual(studentUser.id);
          expect(res.body.email).toEqual(studentCredentials.email);
          expect(res.body.passwordHash).toBeUndefined();
        });
    });

    it('should fail GET /users/:id without authentication - 401', () => {
        return request(app.getHttpServer())
            .get(`/users/${studentUser.id}`)
            .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should fail GET /users/:id for non-admin user (Student) - 403', () => {
        return request(app.getHttpServer())
            .get(`/users/${studentUser.id}`)
            .set('Authorization', `Bearer ${studentToken}`)
            .expect(HttpStatus.FORBIDDEN);
    });

    it('should fail GET /users/:id with invalid UUID format - 400', () => {
      return request(app.getHttpServer())
        .get('/users/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail GET /users/:id if user ID does not exist - 404', () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .get(`/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /users/:id (Admin)', () => {
    const updateDto: UpdateUserDto = {
      role: UserRole.TEACHER,
    };

    it.skip('should update a user (Admin) - 200', () => {
      return request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.id).toEqual(studentUser.id);
          expect(res.body.role).toEqual(UserRole.TEACHER);
          expect(res.body.passwordHash).toBeUndefined();
        });
    });

    it('should fail PATCH /users/:id without authentication - 401', () => {
      return request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .send(updateDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should fail PATCH /users/:id for non-admin user (Student) - 403', () => {
      return request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateDto)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should fail PATCH /users/:id with invalid UUID format - 400', () => {
      return request(app.getHttpServer())
        .patch('/users/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail PATCH /users/:id with invalid data (bad role) - 400', () => {
      const invalidUpdateDto = { role: 'invalid-role' }; 
      return request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidUpdateDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail PATCH /users/:id if user ID does not exist - 404', () => {
      const nonExistentId = '11111111-1111-1111-1111-111111111111';
      return request(app.getHttpServer())
        .patch(`/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(HttpStatus.NOT_FOUND);
    });

     it('should fail PATCH /users/:id if updating email conflicts - 409', () => {
        const conflictUpdateDto: UpdateUserDto = { email: adminCredentials.email };
        return request(app.getHttpServer())
            .patch(`/users/${studentUser.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(conflictUpdateDto)
            .expect(HttpStatus.CONFLICT);
    });
  });

  describe('DELETE /users/:id (Admin)', () => {
    let userToDelete: User;

    beforeEach(async () => {
         const tempCredentials = { email: `delete_me_${Date.now()}@test.com`, password: 'password', role: UserRole.STUDENT, gradeLevel: 1 };
         userToDelete = await authService.register(tempCredentials) as User;
    });

    it.skip('should delete a user (Admin) - 204', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NO_CONTENT);

      const findResult = await userRepository.findOneBy({ id: userToDelete.id });
      expect(findResult).toBeNull();
    });

    it('should fail DELETE /users/:id without authentication - 401', () => {
      return request(app.getHttpServer())
        .delete(`/users/${userToDelete.id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should fail DELETE /users/:id for non-admin user (Student) - 403', () => {
      return request(app.getHttpServer())
        .delete(`/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should fail DELETE /users/:id with invalid UUID format - 400', () => {
      return request(app.getHttpServer())
        .delete('/users/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should fail DELETE /users/:id if user ID does not exist - 404', () => {
      const nonExistentId = '22222222-2222-2222-2222-222222222222';
      return request(app.getHttpServer())
        .delete(`/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
}); 