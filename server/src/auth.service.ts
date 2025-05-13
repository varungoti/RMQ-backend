import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config'; // Import if needed for JWT secret
import { LoginResponseDto } from './dto/auth.dto'; // Import new DTO
import { RefreshJwtPayload } from './auth/refresh-jwt.strategy'; // Import payload type

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name); // Added Logger instance

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService, // Inject ConfigService if JWT secret comes from config
  ) {}

  async validateUser(email: string, pass: string): Promise<Omit<User, 'passwordHash'> | null> {
    this.logger.log(`Validating user: ${email}`);
    const user = await this.usersService.findOneByEmail(email);
    if (user) {
        const isMatch = await bcrypt.compare(pass, user.passwordHash);
        if (isMatch) {
            this.logger.log(`Validation successful for: ${email}`);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { passwordHash, ...result } = user;
            return result; // Return user object without password hash
        }
        this.logger.warn(`Invalid password attempt for: ${email}`);
    }
    this.logger.warn(`User not found during validation: ${email}`);
    return null; // User not found or password incorrect
  }

  async login(user: any): Promise<LoginResponseDto> { // Update return type
    const accessTokenPayload = {
      email: user.email,
      sub: user.id,
      role: user.role, 
    };
    
    const accessSecret = this.configService.get<string>('JWT_SECRET');
    // --- DEBUG LOGGING START ---
    this.logger.warn(`[AuthService.login] Signing Access Token using secret: ${accessSecret ? 'FOUND (length: ' + accessSecret.length + ')' : 'NOT FOUND/EMPTY'}`);
    // --- DEBUG LOGGING END ---
    
    this.logger.log(`Generating Access Token for user ${user.id}, role ${user.role}`);
    const accessToken = this.jwtService.sign(accessTokenPayload, {
        secret: accessSecret, // Use retrieved secret
        expiresIn: this.configService.get<string>('JWT_EXPIRATION_TIME') || '60m',
    });

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    // --- DEBUG LOGGING START ---
    // Optionally log refresh secret too if needed
    // this.logger.warn(`[AuthService.login] Signing Refresh Token using secret: ${refreshSecret ? 'FOUND (length: ' + refreshSecret.length + ')' : 'NOT FOUND/EMPTY'}`);
    // --- DEBUG LOGGING END ---

    const refreshTokenPayload = { sub: user.id };
    this.logger.log(`Generating Refresh Token for user ${user.id}`);
    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
        secret: refreshSecret, // Use retrieved secret
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION_TIME') || '7d', // Longer expiry
    });

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  /**
   * Generates a new access token for a user based on a validated refresh token payload.
   * @param user - The payload from the validated refresh token (contains user ID).
   * @returns A new access token object.
   */
  async refreshToken(user: RefreshJwtPayload): Promise<{ access_token: string }> {
    // We need the user's role again for the new access token payload.
    // Fetch the full user details using the ID from the refresh token payload.
    const fullUser = await this.usersService.findByIdInternal(user.sub); // Use internal method that returns full user
    if (!fullUser) {
        // This shouldn't normally happen if the refresh token was valid,
        // but handles edge cases like user deleted after token issuance.
        this.logger.error(`User ${user.sub} not found during refresh token validation.`);
        throw new UnauthorizedException('User associated with token not found');
    }

    // Create payload for the new access token
    const newAccessTokenPayload = {
      email: fullUser.email,
      sub: fullUser.id,
      role: fullUser.role, 
    };
    this.logger.log(`Refreshing Access Token for user ${fullUser.id}, role ${fullUser.role}`);
    const newAccessToken = this.jwtService.sign(newAccessTokenPayload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRATION_TIME') || '60m',
    });

    return {
      access_token: newAccessToken,
    };
  }

  async register(createUserDto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    this.logger.log(`Attempting registration for: ${createUserDto.email}`);
    const existingUser = await this.usersService.findOneByEmail(createUserDto.email);
    if (existingUser) {
      this.logger.warn(`Registration failed: Email already exists - ${createUserDto.email}`);
      throw new ConflictException('Email already exists');
    }

    // Hashing is handled by UsersService.create, remove redundant hashing here
    // const saltRounds = 10; 
    // const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);
    // this.logger.log(`Password hashed for: ${createUserDto.email}`);

    // Create user via UsersService
    try {
      // Pass the original DTO, the service handles hashing and role defaults
      const newUserWithoutPassword = await this.usersService.create(createUserDto);
      this.logger.log(`User registered successfully: ${newUserWithoutPassword.email} (ID: ${newUserWithoutPassword.id})`);
      return newUserWithoutPassword;
    } catch (error) {
      this.logger.error(`Error during user creation for ${createUserDto.email}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
