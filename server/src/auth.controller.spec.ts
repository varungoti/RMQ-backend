import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { ExecutionContext, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserRole } from './entities/user.entity';

// Mock AuthService
const mockAuthService = {
  login: jest.fn(),
  register: jest.fn(),
};

// Mock User Data
const mockUserId = 'user-auth-test-uuid';
const mockUser: User = {
    id: mockUserId,
    email: 'test@example.com',
    passwordHash: 'hashed',
    role: UserRole.STUDENT,
    gradeLevel: 5,
    assessmentSessions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let service: typeof mockAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
    // Mock LocalAuthGuard
    .overrideGuard(LocalAuthGuard)
    .useValue({
      canActivate: (context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = mockUser;
        return true;
      },
    })
    .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return an access token upon successful login', async () => {
      const req = { user: mockUser };
      const loginResult = { access_token: 'mockAccessToken' };
      
      service.login.mockResolvedValue(loginResult);

      const result = await controller.login(req);
      
      expect(result).toEqual(loginResult);
      expect(service.login).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const createUserDto: CreateUserDto = { 
        email: 'new@example.com', 
        password: 'password123',
        gradeLevel: 5 // Add required gradeLevel 
      };
      // Mock the return value from the service (should not include passwordHash)
      const expectedRegisteredUser: Partial<User> = {
          id: 'new-user-uuid',
          email: createUserDto.email,
          role: UserRole.STUDENT, // Assuming default role
          gradeLevel: createUserDto.gradeLevel, // Include gradeLevel in expected response
      };

      service.register.mockResolvedValue(expectedRegisteredUser as User); // Cast for mock

      const result = await controller.register(createUserDto);

      // We expect the controller to return what the service returned
      expect(result).toEqual(expectedRegisteredUser);
      expect(service.register).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw ConflictException if email already exists', async () => {
      const createUserDto: CreateUserDto = { 
        email: 'existing@example.com', 
        password: 'password123',
        gradeLevel: 5 // Add required gradeLevel
      };
      
      service.register.mockRejectedValue(new ConflictException('Email already exists'));

      await expect(controller.register(createUserDto)).rejects.toThrow(ConflictException);
      expect(service.register).toHaveBeenCalledWith(createUserDto);
    });
  });
});
