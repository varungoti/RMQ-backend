import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class StudentGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
