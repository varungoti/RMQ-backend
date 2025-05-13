import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * This guard automatically triggers the JwtStrategy.
 * It expects a valid JWT in the Authorization header (Bearer <token>).
 * The JwtStrategy validates the token signature and expiration.
 * If valid, the strategy's validate() method runs, using the payload to find the user.
 * The user object returned by validate() is attached to request.user.
 * If validation fails (invalid token, expired, user not found), it throws an UnauthorizedException.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
