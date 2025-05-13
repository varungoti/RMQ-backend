import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../server/src/app.module'; // Assuming AppModule is the root module
import { User } from '../server/src/entities/user.entity'; // Adjust path if needed
import { Skill } from '../server/src/entities/skill.entity'; // Adjust path if needed
import { Role } from '../server/src/role.enum'; // Adjust path if needed
import { setupTestApp, loginAndGetToken, adminCredentials, studentCredentials } from '../server/test/utils/e2e-setup'; // Adjust path if needed

// It looks like these variables might need to be declared within the describe block
// let app: INestApplication;
// let userRepository: Repository<User>;
// let skillRepository: Repository<Skill>;

describe('SkillsController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let skillRepository: Repository<Skill>;
  let adminToken: string;
  let studentToken: string;

  beforeAll(async () => {
    app = await setupTestApp();
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    skillRepository = app.get<Repository<Skill>>(getRepositoryToken(Skill));

    // Clean up potential existing test data
    await skillRepository.query('DELETE FROM skills WHERE name LIKE \'%E2E Skill Test%\';');
    await userRepository.delete({ email: adminCredentials.email });
    await userRepository.delete({ email: studentCredentials.email });

    // Create users and get tokens
    await userRepository.save(
      userRepository.create({ ...adminCredentials, role: Role.ADMIN }),
    );
    await userRepository.save(
      userRepository.create({ ...studentCredentials, role: Role.STUDENT }),
    );
    adminToken = await loginAndGetToken(app, adminCredentials);
    studentToken = await loginAndGetToken(app, studentCredentials);
  });

  afterAll(async () => {
    // Clean up test data
    await skillRepository.query('DELETE FROM skills WHERE name LIKE \'%E2E Skill Test%\';');
    await userRepository.delete({ email: adminCredentials.email });
    await userRepository.delete({ email: studentCredentials.email });
    await app.close();
  });

  // ... rest of the test cases ...
}); 