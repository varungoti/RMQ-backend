import { Test, TestingModule } from '@nestjs/testing';
import { LocalStrategy } from './auth/local.strategy'; // Adjusted import path
import { AuthService } from './auth.service'; // Adjusted import path
import { User, UserRole } from './entities/user.entity'; // Adjusted import path
import { UnauthorizedException } from '@nestjs/common';

// Mock AuthService
const mockAuthService = {
  validateUser: jest.fn(),
};

// Mock User Data
const mockUser: User = {
    id: 'user-local-test-uuid',
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    role: UserRole.STUDENT,
    gradeLevel: 5,
    assessmentSessions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: typeof mockAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return the user if validation is successful', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      authService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(email, password);

      expect(result).toEqual(mockUser);
      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should throw UnauthorizedException if validation fails', async () => {
      const email = 'wrong@example.com';
      const password = 'wrongpassword';
      authService.validateUser.mockResolvedValue(null); // Simulate failed validation

      await expect(strategy.validate(email, password)).rejects.toThrow(UnauthorizedException);
      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
    });
  });
}); 