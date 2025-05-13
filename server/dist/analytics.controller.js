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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("./auth/jwt-auth.guard");
const roles_guard_1 = require("./guards/roles.guard");
const roles_decorator_1 = require("./decorators/roles.decorator");
const user_entity_1 = require("./entities/user.entity");
const analytics_service_1 = require("./analytics.service");
const user_performance_dto_1 = require("./dto/user-performance.dto");
let AnalyticsController = class AnalyticsController {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async getUserPerformance(req, queryParams) {
        if (queryParams.userId && queryParams.userId !== req.user.userId) {
            if (req.user.role !== user_entity_1.UserRole.ADMIN) {
                throw new common_1.ForbiddenException('Only administrators can access other users\' performance data');
            }
        }
        return this.analyticsService.getUserPerformance(req.user.userId, queryParams);
    }
    async getSkillPerformance(req, skillId) {
        const queryParams = {
            skillId
        };
        const performance = await this.analyticsService.getUserPerformance(req.user.userId, queryParams);
        return performance.skillPerformance.length > 0
            ? performance.skillPerformance[0]
            : { skillId, message: 'No performance data available for this skill' };
    }
    async getClassPerformance(gradeLevel) {
        return this.analyticsService.getClassPerformance(gradeLevel);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('user-performance'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user performance analytics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns user performance data', type: user_performance_dto_1.UserPerformanceDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - accessing other user data without admin privileges' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, user_performance_dto_1.UserPerformanceQueryDto]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getUserPerformance", null);
__decorate([
    (0, common_1.Get)('skill/:skillId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get performance data for a specific skill' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns skill performance data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Skill not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('skillId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getSkillPerformance", null);
__decorate([
    (0, common_1.Get)('class/:gradeLevel'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.TEACHER),
    (0, swagger_1.ApiOperation)({ summary: 'Get class-wide performance for a grade level (admin/teacher only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns class performance data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - requires admin or teacher role' }),
    __param(0, (0, common_1.Param)('gradeLevel', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getClassPerformance", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)('Analytics'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('analytics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map