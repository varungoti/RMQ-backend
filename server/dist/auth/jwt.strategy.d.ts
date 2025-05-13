import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users.service';
import { UserRole } from 'src/entities/user.entity';
interface JwtPayload {
    email: string;
    sub: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private usersService;
    private readonly logger;
    constructor(configService: ConfigService, usersService: UsersService);
    validate(payload: JwtPayload): Promise<{
        userId: string;
        email: string;
        role: UserRole;
    }>;
}
export {};
