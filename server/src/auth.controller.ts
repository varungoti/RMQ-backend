import { Controller, Request, Post, UseGuards, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RefreshJwtAuthGuard } from './auth/refresh-jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginResponseDto, RefreshTokenDto } from './dto/auth.dto';
import { User } from './entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  /**
   * Handles user login using Local Strategy.
   * POST /auth/login
   * @param req - The request object, enriched with user by LocalAuthGuard.
   * @returns An object containing the JWT access token.
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logs a user in' })
  @ApiBody({ 
    description: 'User credentials for login',
    schema: { 
      properties: { 
        email: { type: 'string', example: 'user@example.com' }, 
        password: { type: 'string', format: 'password', example: 'password123' } 
      },
      required: ['email', 'password']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful, returns access and refresh tokens.', 
    type: LoginResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid credentials.' })
  async login(@Request() req: { user: Omit<User, 'passwordHash'> }): Promise<LoginResponseDto> {
    this.logger.log(`Login successful for user: ${req.user.email}`);
    return this.authService.login(req.user);
  }

  /**
   * Handles new user registration.
   * POST /auth/register
   * @param createUserDto - DTO containing email and password.
   * @returns The newly created user object (without password hash).
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registers a new user' })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully. Response excludes password hash.',
    type: User
  }) 
  @ApiResponse({ status: 409, description: 'Conflict - Email already exists.' })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed (e.g., invalid email, weak password, missing fields).' })
  async register(@Body() createUserDto: CreateUserDto) {
    this.logger.log(`Registration attempt for email: ${createUserDto.email}`);
    const user = await this.authService.register(createUserDto);
    this.logger.log(`Registration successful for user: ${user?.email}`);
    return user;
  }

  @UseGuards(RefreshJwtAuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200, 
    description: 'Access token refreshed successfully.',
    schema: { type: 'object', properties: { access_token: { type: 'string' } } },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid Refresh Token' })
  async refreshToken(@Request() req): Promise<{ access_token: string }> {
    this.logger.log(`Refresh token request received for user sub: ${req.user?.sub}`);
    return this.authService.refreshToken(req.user);
  }

  // Example of a protected route (optional for now)
  /*
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
      this.logger.log(`Fetching profile for user: ${req.user.email}`);
      return req.user;
  }
  */
}
