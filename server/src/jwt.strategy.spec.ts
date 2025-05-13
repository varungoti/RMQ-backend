import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './auth/jwt.strategy'; // Adjusted import path
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service'; // Import UsersService
import { User, UserRole } from './entities/user.entity'; // Import User entity for mock
import { UnauthorizedException } from '@nestjs/common'; // Import for error checking if needed

// Mock ConfigService
const mockConfigService = {
  get: jest.fn().mockReturnValue('test-secret'), // Provide a mock JWT secret
};

// Mock UsersService - Mock findByIdInternal
const mockUsersService = {
  findByIdInternal: jest.fn(), 
};

// Mock User Data for validation result
const mockUserFromDb: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    role: UserRole.STUDENT,
    gradeLevel: 5,
    assessmentSessions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: typeof mockUsersService; // Hold reference to mock

  beforeEach(async () => {
    // Reset mocks before each test
    mockUsersService.findByIdInternal.mockReset(); // Reset the correct mock

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UsersService, // Provide the mock UsersService
          useValue: mockUsersService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get(UsersService); // Get the mock instance
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const payload = {
        sub: 'test-user-id',
        email: 'test@example.com',
        role: UserRole.STUDENT
      };

    it('should validate and return the user details if user is found', async () => {
      usersService.findByIdInternal.mockResolvedValue(mockUserFromDb); // Mock findByIdInternal

      // Expected result based on strategy implementation
      const expectedResult = { 
          userId: mockUserFromDb.id, 
          email: mockUserFromDb.email, 
          role: mockUserFromDb.role 
      };

      const result = await strategy.validate(payload);

      expect(usersService.findByIdInternal).toHaveBeenCalledWith(payload.sub); // Check findByIdInternal call
      expect(result).toEqual(expectedResult);
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      usersService.findByIdInternal.mockResolvedValue(null); // Mock findByIdInternal to return null

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      expect(usersService.findByIdInternal).toHaveBeenCalledWith(payload.sub); // Check findByIdInternal call
    });
  });
}); 