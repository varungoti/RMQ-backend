import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../entities/user.entity'; // Adjust path as needed
import { ROLES_KEY } from '../decorators/roles.decorator'; // Adjust path as needed

// Define a type for the user object expected on the request
interface RequestUser {
    id: string; // Or number, depending on your User ID type
    email: string;
    role: UserRole; // Crucially includes the role
    // Add other properties from your JWT payload if necessary
}

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user?: RequestUser }>();

    // Log details before checking
    const requiredRolesString = JSON.stringify(requiredRoles);
    const userRoleString = user ? user.role : 'undefined';
    this.logger.warn(`[RolesGuard Check] Required: ${requiredRolesString} | User Role: ${userRoleString}`);

    if (!user || !user.role) {
        this.logger.error(`[RolesGuard Deny] User or user role is missing from request.`);
        return false;
    }
    
    // Perform the check and log the comparison result explicitly
    const hasRole = requiredRoles.some((requiredRole) => {
        const comparison = user.role === requiredRole;
        this.logger.warn(`[RolesGuard Compare] Comparing user role '${user.role}' === required role '${requiredRole}' -> ${comparison}`);
        return comparison;
    });

    if (!hasRole) {
        this.logger.error(`[RolesGuard Deny] User role "${user.role}" does not match ANY required roles [${requiredRoles.join(', ')}].`);
    }

    this.logger.log(`[RolesGuard Result] Access ${hasRole ? 'Granted' : 'Denied'}`);
    return hasRole;
  }
} 