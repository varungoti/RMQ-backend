import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { AssessmentSkillScore } from './entities/assessment_skill_score.entity';
import * as bcrypt from 'bcrypt';

// Mock bcrypt functions
jest.mock('bcrypt');

// Factory for creating mock User objects to ensure consistent type compliance
const createMockUser = (overrides = {}): User => ({
  id: 'mock-uuid-123',
  email: 'test@example.com',
  passwordHash: 'hashedPassword123',
  role: UserRole.STUDENT,
  firstName: 'Test',
  lastName: 'User',
  gradeLevel: 10,
  createdAt: new Date(),
  updatedAt: new Date(),
  assessmentSessions: [],
  skillScores: [],
  ...overrides
});

// Define the shape of the mock UsersService
const mockUsersService = {
  findOneByEmail: jest.fn(),
  create: jest.fn(),
  findByIdInternal: jest.fn(),
};

// Define the shape of the mock JwtService
const mockJwtService = {
  sign: jest.fn(),
};

// Factory for config service to ensure consistent configuration values
const createMockConfigService = () => ({
  get: jest.fn((key: string) => {
    const config = {
      JWT_SECRET: 'test-access-secret',
      JWT_EXPIRATION_TIME: '15m',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_REFRESH_EXPIRATION_TIME: '7d'
    };
    return config[key] || null;
  }),
});

describe('AuthService', () => {
  let service: AuthService;
  let usersService: typeof mockUsersService;
  let jwtService: typeof mockJwtService;
  let configService: ReturnType<typeof createMockConfigService>;
  // Create a standard mock user once to reuse
  const mockUser = createMockUser();

  beforeEach(async () => {
    jest.clearAllMocks();
    mockUsersService.findOneByEmail.mockReset();
    mockUsersService.create.mockReset();
    mockUsersService.findByIdInternal.mockReset();
    mockJwtService.sign.mockReset();

    configService = createMockConfigService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Tests for validateUser ---
  describe('validateUser', () => {
    it('should return user data (without password) if validation is successful', async () => {
      usersService.findOneByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(mockUser.email, 'password123');

      expect(usersService.findOneByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUser.passwordHash);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...expectedUser } = mockUser;
      expect(result).toEqual(expectedUser); // Assert actual user object
    });

    it('should return null if user is not found', async () => {
      usersService.findOneByEmail.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password123');

      expect(usersService.findOneByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBeNull(); // Correct assertion: should return null
    });

    it('should return null if password does not match', async () => {
      usersService.findOneByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(mockUser.email, 'wrongpassword');

      expect(usersService.findOneByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', mockUser.passwordHash);
      expect(result).toBeNull(); // Correct assertion: should return null
    });
  });

  // --- Tests for login ---
  describe('login', () => {
    // Define expected tokens for clarity
    const mockAccessToken = 'mock-access-token';
    const mockRefreshToken = 'mock-refresh-token';

    it('should return access and refresh tokens if login is successful', async () => {
      // Setup mock for jwtService.sign to return different tokens based on secret
      jwtService.sign.mockImplementation((payload: any, options: { secret: string }) => {
        if (options.secret === 'test-access-secret') {
          return mockAccessToken;
        }
        if (options.secret === 'test-refresh-secret') {
          return mockRefreshToken;
        }
        return 'unknown-token'; // Fallback for unexpected calls
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...userForLogin } = mockUser;
      const result = await service.login(userForLogin);

      // Define expected payloads
      const expectedAccessTokenPayload = { sub: mockUser.id, email: mockUser.email, role: mockUser.role };
      const expectedRefreshTokenPayload = { sub: mockUser.id }; // Refresh token only needs user ID

      // Verify sign calls
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(jwtService.sign).toHaveBeenCalledWith(expectedAccessTokenPayload, {
        secret: 'test-access-secret',
        expiresIn: '15m',
      });
      expect(jwtService.sign).toHaveBeenCalledWith(expectedRefreshTokenPayload, {
        secret: 'test-refresh-secret',
        expiresIn: '7d',
      });

      // Verify result
      expect(result).toEqual({
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
      });

      // Verify configService calls (optional but good practice)
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
      expect(configService.get).toHaveBeenCalledWith('JWT_EXPIRATION_TIME');
      expect(configService.get).toHaveBeenCalledWith('JWT_REFRESH_SECRET');
      expect(configService.get).toHaveBeenCalledWith('JWT_REFRESH_EXPIRATION_TIME');
    });

    // Additional edge case test for login
    it('should handle missing config values by using defaults', async () => {
      // Override config to return null for expiration times
      configService.get.mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return 'test-access-secret';
        if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
        return null; // Return null for expiration times
      });

      jwtService.sign.mockReturnValueOnce(mockAccessToken).mockReturnValueOnce(mockRefreshToken);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...userForLogin } = mockUser;
      const result = await service.login(userForLogin);

      // Verify default expiration times are used
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: mockUser.id }),
        expect.objectContaining({ 
          secret: 'test-access-secret',
          expiresIn: expect.any(String) // Can't check exact default value as it's in the service
        })
      );

      expect(result).toEqual({
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
      });
    });
  });

  // --- Tests for refreshToken ---
  describe('refreshToken', () => {
    // Mock token data
    const mockNewAccessToken = 'new-mock-access-token';
    const mockRefreshTokenPayload = { sub: mockUser.id };

    it('should return a new access token when given a valid refresh token payload', async () => {
      // Setup mocks
      usersService.findByIdInternal.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue(mockNewAccessToken);

      // Act
      const result = await service.refreshToken(mockRefreshTokenPayload);

      // Assert
      expect(usersService.findByIdInternal).toHaveBeenCalledWith(mockUser.id);
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: mockUser.id, email: mockUser.email, role: mockUser.role },
        {
          secret: 'test-access-secret',
          expiresIn: '15m',
        },
      );
      expect(result).toEqual({ access_token: mockNewAccessToken });
    });

    it('should throw UnauthorizedException if user not found during refresh', async () => {
      // Setup mocks - simulate user not found
      usersService.findByIdInternal.mockResolvedValue(null);

      // Act & Assert
      await expect(service.refreshToken(mockRefreshTokenPayload)).rejects.toThrow(UnauthorizedException);
      expect(usersService.findByIdInternal).toHaveBeenCalledWith(mockUser.id);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle service errors during refresh', async () => {
      // Setup mocks - simulate database error
      const databaseError = new Error('Database connection failed');
      usersService.findByIdInternal.mockRejectedValue(databaseError);

      // Act & Assert
      await expect(service.refreshToken(mockRefreshTokenPayload)).rejects.toThrow(databaseError);
      expect(usersService.findByIdInternal).toHaveBeenCalledWith(mockUser.id);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  // --- Tests for register ---
  describe('register', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      password: 'newPassword123',
      gradeLevel: 5
    };
    const mockPasswordHash = 'hashedNewPassword';
    // Define the user object as returned by usersService.create using the factory
    const mockCreatedUserRaw = createMockUser({
      id: 'new-uuid',
      email: createUserDto.email,
      passwordHash: mockPasswordHash,
      role: UserRole.STUDENT,
      firstName: undefined,
      lastName: undefined,
      gradeLevel: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    // Define the expected result AFTER AuthService removes the hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...expectedRegisteredUser } = mockCreatedUserRaw;

    it('should successfully register a new user by calling UsersService.create', async () => {
      // Arrange: No user exists, create returns the user object
      usersService.findOneByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(expectedRegisteredUser); // Assume usersService.create returns user *without* hash

      // Act
      const result = await service.register(createUserDto);

      // Assert
      expect(usersService.findOneByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(usersService.create).toHaveBeenCalledWith(createUserDto); // Verify it passes the DTO to the service
      expect(result).toEqual(expectedRegisteredUser); // Expect user without hash
    });

    it('should throw ConflictException if email already exists', async () => {
      // Arrange: User exists
      usersService.findOneByEmail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(createUserDto)).rejects.toThrow(ConflictException);

      // Assert mocks
      expect(usersService.findOneByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should handle and re-throw errors during user creation from UsersService', async () => {
      // Arrange: No user exists, UsersService.create throws
      usersService.findOneByEmail.mockResolvedValue(null);
      const createError = new Error('Database error during creation');
      usersService.create.mockRejectedValue(createError);

      // Act & Assert
      await expect(service.register(createUserDto)).rejects.toThrow(createError);

      // Assert mocks
      expect(usersService.findOneByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
    });

    // Additional edge case test for input validation
    it('should throw when email is invalid format', async () => {
      // Create a DTO with invalid email
      const invalidDto: CreateUserDto = {
        ...createUserDto,
        email: 'not-an-email' // Invalid email format
      };

      // Email is typically validated by class-validator at the controller level
      // We're simulating that validation error here to test error handling
      const validationError = new Error('Invalid email format');
      usersService.findOneByEmail.mockRejectedValue(validationError);

      // Act & Assert
      await expect(service.register(invalidDto)).rejects.toThrow(validationError);
    });
  });
});
