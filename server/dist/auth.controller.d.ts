import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginResponseDto } from './dto/auth.dto';
import { User } from './entities/user.entity';
export declare class AuthController {
    private authService;
    private readonly logger;
    constructor(authService: AuthService);
    login(req: {
        user: Omit<User, 'passwordHash'>;
    }): Promise<LoginResponseDto>;
    register(createUserDto: CreateUserDto): Promise<Omit<User, "passwordHash">>;
    refreshToken(req: any): Promise<{
        access_token: string;
    }>;
}
