import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class StudentGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('User not found in request');
    }
    
    if (user.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only students can access this resource');
    }
    
    return true;
  }
} 