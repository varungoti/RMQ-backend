"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const config_1 = require("@nestjs/config");
let AuthService = AuthService_1 = class AuthService {
    constructor(usersService, jwtService, configService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async validateUser(email, pass) {
        this.logger.log(`Validating user: ${email}`);
        const user = await this.usersService.findOneByEmail(email);
        if (user) {
            const isMatch = await bcrypt.compare(pass, user.passwordHash);
            if (isMatch) {
                this.logger.log(`Validation successful for: ${email}`);
                const { passwordHash, ...result } = user;
                return result;
            }
            this.logger.warn(`Invalid password attempt for: ${email}`);
        }
        this.logger.warn(`User not found during validation: ${email}`);
        return null;
    }
    async login(user) {
        const accessTokenPayload = {
            email: user.email,
            sub: user.id,
            role: user.role,
        };
        const accessSecret = this.configService.get('JWT_SECRET');
        this.logger.warn(`[AuthService.login] Signing Access Token using secret: ${accessSecret ? 'FOUND (length: ' + accessSecret.length + ')' : 'NOT FOUND/EMPTY'}`);
        this.logger.log(`Generating Access Token for user ${user.id}, role ${user.role}`);
        const accessToken = this.jwtService.sign(accessTokenPayload, {
            secret: accessSecret,
            expiresIn: this.configService.get('JWT_EXPIRATION_TIME') || '60m',
        });
        const refreshSecret = this.configService.get('JWT_REFRESH_SECRET');
        const refreshTokenPayload = { sub: user.id };
        this.logger.log(`Generating Refresh Token for user ${user.id}`);
        const refreshToken = this.jwtService.sign(refreshTokenPayload, {
            secret: refreshSecret,
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION_TIME') || '7d',
        });
        return { access_token: accessToken, refresh_token: refreshToken };
    }
    async refreshToken(user) {
        const fullUser = await this.usersService.findByIdInternal(user.sub);
        if (!fullUser) {
            this.logger.error(`User ${user.sub} not found during refresh token validation.`);
            throw new common_1.UnauthorizedException('User associated with token not found');
        }
        const newAccessTokenPayload = {
            email: fullUser.email,
            sub: fullUser.id,
            role: fullUser.role,
        };
        this.logger.log(`Refreshing Access Token for user ${fullUser.id}, role ${fullUser.role}`);
        const newAccessToken = this.jwtService.sign(newAccessTokenPayload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: this.configService.get('JWT_EXPIRATION_TIME') || '60m',
        });
        return {
            access_token: newAccessToken,
        };
    }
    async register(createUserDto) {
        this.logger.log(`Attempting registration for: ${createUserDto.email}`);
        const existingUser = await this.usersService.findOneByEmail(createUserDto.email);
        if (existingUser) {
            this.logger.warn(`Registration failed: Email already exists - ${createUserDto.email}`);
            throw new common_1.ConflictException('Email already exists');
        }
        try {
            const newUserWithoutPassword = await this.usersService.create(createUserDto);
            this.logger.log(`User registered successfully: ${newUserWithoutPassword.email} (ID: ${newUserWithoutPassword.id})`);
            return newUserWithoutPassword;
        }
        catch (error) {
            this.logger.error(`Error during user creation for ${createUserDto.email}: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map