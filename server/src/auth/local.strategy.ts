import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthService } from '../auth.service'; // Adjusted path
import { User } from '../entities/user.entity'; // Adjusted path

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(private authService: AuthService) {
    super({ usernameField: 'email' }); // Configure passport-local to use 'email' as the username field
  }

  /**
   * Passport automatically calls this method during the local authentication flow.
   * It uses the AuthService.validateUser method.
   * @param email - The email provided by the user.
   * @param password - The password provided by the user.
   * @returns The validated user object (without password hash).
   * @throws UnauthorizedException if validation fails.
   */
  async validate(email: string, password: string): Promise<Omit<User, 'passwordHash'> | null> {
    this.logger.log(`LocalStrategy attempting validation for user: ${email}`);
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      this.logger.warn(`LocalStrategy validation failed for user: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    this.logger.log(`LocalStrategy validation successful for user: ${email}`);
    return user;
  }
}
