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
var JwtStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const passport_jwt_1 = require("passport-jwt");
const passport_1 = require("@nestjs/passport");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const users_service_1 = require("../users.service");
let JwtStrategy = JwtStrategy_1 = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(configService, usersService) {
        const secret = configService.get('JWT_SECRET');
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret || '',
        });
        this.configService = configService;
        this.usersService = usersService;
        this.logger = new common_1.Logger(JwtStrategy_1.name);
        this.logger.warn(`[JwtStrategy Constructor] JWT_SECRET retrieved from ConfigService: ${secret ? 'FOUND (length: ' + secret.length + ')' : 'NOT FOUND/EMPTY'}`);
        if (!secret) {
            this.logger.warn('JWT_SECRET is not set in environment variables! Strategy is using an empty string fallback.');
        }
    }
    async validate(payload) {
        this.logger.log(`JWT Strategy validating payload for user ID: ${payload.sub}`);
        const user = await this.usersService.findByIdInternal(payload.sub);
        if (!user) {
            this.logger.warn(`JWT Strategy validation failed: User with ID ${payload.sub} not found.`);
            throw new common_1.UnauthorizedException('User not found or token invalid');
        }
        this.logger.log(`JWT Strategy validation successful for user ID: ${payload.sub}`);
        return { userId: user.id, email: user.email, role: user.role };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = JwtStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        users_service_1.UsersService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map