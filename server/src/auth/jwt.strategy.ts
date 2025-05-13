// JWT Strategy will be implemented here

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users.service'; // Adjusted path
import { User, UserRole } from '../entities/user.entity'; // Adjusted path

// Define the expected payload structure
interface JwtPayload {
  email: string;
  sub: string; // Standard JWT subject claim (user ID)
  role: UserRole; // Include role
  iat?: number; // Issued at (standard JWT claim)
  exp?: number; // Expiration time (standard JWT claim)
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private usersService: UsersService, // Inject UsersService to find user by ID
  ) {
    // Retrieve secret first
    const secret = configService.get<string>('JWT_SECRET');
    
    // Call super immediately with the secret or fallback
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret || '', 
    });

    // Now log the retrieved secret
    // --- DEBUG LOGGING START ---
    this.logger.warn(`[JwtStrategy Constructor] JWT_SECRET retrieved from ConfigService: ${secret ? 'FOUND (length: ' + secret.length + ')' : 'NOT FOUND/EMPTY'}`);
    // --- DEBUG LOGGING END ---
    
    if (!secret) {
        this.logger.warn('JWT_SECRET is not set in environment variables! Strategy is using an empty string fallback.');
    }
  }

  /**
   * Passport automatically calls this after verifying the JWT signature.
   * The payload is the decoded JWT content.
   * We use it to find the user and attach it to the request object.
   * @param payload - The decoded JWT payload.
   * @returns The user object associated with the token.
   * @throws UnauthorizedException if the user is not found.
   */
  async validate(payload: JwtPayload): Promise<{ userId: string; email: string; role: UserRole }> {
    this.logger.log(`JWT Strategy validating payload for user ID: ${payload.sub}`);
    // You could add more validation here, e.g., check if the role in the payload is still valid

    // Find the user based on the ID (string) from the payload
    // Use findByIdInternal to get the full user object if needed, though we only need role here
    const user = await this.usersService.findByIdInternal(payload.sub);

    if (!user) {
      this.logger.warn(`JWT Strategy validation failed: User with ID ${payload.sub} not found.`);
      throw new UnauthorizedException('User not found or token invalid');
    }

    this.logger.log(`JWT Strategy validation successful for user ID: ${payload.sub}`);
    // Return the necessary details (userId, email, role) to be attached to request.user
    return { userId: user.id, email: user.email, role: user.role };
  }
}
