import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * This guard automatically triggers the LocalStrategy.
 * The strategy will run its validate() method.
 * If validation succeeds, the user object returned by validate() is attached to request.user.
 * If validation fails, it throws an UnauthorizedException by default.
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
