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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const local_auth_guard_1 = require("./auth/local-auth.guard");
const refresh_jwt_auth_guard_1 = require("./auth/refresh-jwt-auth.guard");
const create_user_dto_1 = require("./dto/create-user.dto");
const auth_dto_1 = require("./dto/auth.dto");
const user_entity_1 = require("./entities/user.entity");
const swagger_1 = require("@nestjs/swagger");
let AuthController = AuthController_1 = class AuthController {
    constructor(authService) {
        this.authService = authService;
        this.logger = new common_1.Logger(AuthController_1.name);
    }
    async login(req) {
        this.logger.log(`Login successful for user: ${req.user.email}`);
        return this.authService.login(req.user);
    }
    async register(createUserDto) {
        this.logger.log(`Registration attempt for email: ${createUserDto.email}`);
        const user = await this.authService.register(createUserDto);
        this.logger.log(`Registration successful for user: ${user?.email}`);
        return user;
    }
    async refreshToken(req) {
        this.logger.log(`Refresh token request received for user sub: ${req.user?.sub}`);
        return this.authService.refreshToken(req.user);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.UseGuards)(local_auth_guard_1.LocalAuthGuard),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Logs a user in' }),
    (0, swagger_1.ApiBody)({
        description: 'User credentials for login',
        schema: {
            properties: {
                email: { type: 'string', example: 'user@example.com' },
                password: { type: 'string', format: 'password', example: 'password123' }
            },
            required: ['email', 'password']
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Login successful, returns access and refresh tokens.',
        type: auth_dto_1.LoginResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid credentials.' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Registers a new user' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'User registered successfully. Response excludes password hash.',
        type: user_entity_1.User
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Conflict - Email already exists.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad Request - Validation failed (e.g., invalid email, weak password, missing fields).' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.UseGuards)(refresh_jwt_auth_guard_1.RefreshJwtAuthGuard),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh access token' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Access token refreshed successfully.',
        schema: { type: 'object', properties: { access_token: { type: 'string' } } },
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid Refresh Token' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
exports.AuthController = AuthController = AuthController_1 = __decorate([
    (0, swagger_1.ApiTags)('Authentication'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map