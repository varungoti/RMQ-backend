import { UserRole } from 'src/entities/user.entity';
export declare class CreateUserDto {
    email: string;
    password: string;
    role?: UserRole;
    gradeLevel: number;
}
