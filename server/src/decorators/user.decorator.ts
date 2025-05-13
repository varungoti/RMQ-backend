import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator @User() to extract the user object from the request.
 * Assumes the user object is attached by an authentication guard (e.g., JwtAuthGuard).
 */
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // Return the user object attached by the auth guard
    return request.user;
  },
); 