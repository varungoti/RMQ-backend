import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../entities/user.entity'; // Adjust path as necessary

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    // Assuming the user object is attached to the request by JwtAuthGuard
    // Modify 'user' if your strategy attaches it differently
    return request.user;
  },
); 