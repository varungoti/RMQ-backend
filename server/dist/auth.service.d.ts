import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { LoginResponseDto } from './dto/auth.dto';
import { RefreshJwtPayload } from './auth/refresh-jwt.strategy';
export declare class AuthService {
    private usersService;
    private jwtService;
    private configService;
    private readonly logger;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService);
    validateUser(email: string, pass: string): Promise<Omit<User, 'passwordHash'> | null>;
    login(user: any): Promise<LoginResponseDto>;
    refreshToken(user: RefreshJwtPayload): Promise<{
        access_token: string;
    }>;
    register(createUserDto: CreateUserDto): Promise<Omit<User, 'passwordHash'>>;
}
