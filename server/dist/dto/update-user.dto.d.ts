import { UserRole } from '../entities/user.entity';
export declare class UpdateUserDto {
    email?: string;
    password?: string;
    role?: UserRole;
}
