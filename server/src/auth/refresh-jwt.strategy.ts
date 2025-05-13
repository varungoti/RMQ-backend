import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

// Define the structure of the validated payload from the Refresh JWT
export interface RefreshJwtPayload {
  sub: string; // User ID
  iat?: number; // Issued At
  exp?: number; // Expiration Time
}

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private configService: ConfigService) {
    super({
      // Extract token from Authorization header as Bearer token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // DO NOT ignore expiration for refresh tokens
      ignoreExpiration: false,
      // Use the dedicated refresh secret from configuration
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
      // Pass the request object to the validate method (needed to potentially extract token if required elsewhere)
      passReqToCallback: true, 
    });
  }

  /**
   * Validate the refresh token payload.
   * Passport first verifies signature and expiration based on constructor options.
   * This method receives the decoded payload if valid.
   * @param req The request object
   * @param payload The decoded JWT payload (RefreshJwtPayload)
   * @returns The validated payload, which gets attached to req.user
   */
  async validate(req: Request, payload: RefreshJwtPayload): Promise<RefreshJwtPayload> {
    // Basic validation passed (signature, expiration).
    // We trust the payload 'sub' (userId) is correct.
    // Optional: Add checks here if refresh tokens are stored and need to be validated against DB/cache.
    // For a stateless approach, we just return the payload.
    
    // Attach the raw refresh token to the request if needed for downstream logic (e.g., future revocation)
    // const refreshToken = req.get('authorization')?.replace('Bearer', '').trim();
    
    if (!payload || !payload.sub) {
        throw new UnauthorizedException('Invalid refresh token payload');
    }

    return { sub: payload.sub }; // Return only the necessary info (userId)
  }
} 