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
var RolesGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const roles_decorator_1 = require("../decorators/roles.decorator");
let RolesGuard = RolesGuard_1 = class RolesGuard {
    constructor(reflector) {
        this.reflector = reflector;
        this.logger = new common_1.Logger(RolesGuard_1.name);
    }
    canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(roles_decorator_1.ROLES_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();
        const requiredRolesString = JSON.stringify(requiredRoles);
        const userRoleString = user ? user.role : 'undefined';
        this.logger.warn(`[RolesGuard Check] Required: ${requiredRolesString} | User Role: ${userRoleString}`);
        if (!user || !user.role) {
            this.logger.error(`[RolesGuard Deny] User or user role is missing from request.`);
            return false;
        }
        const hasRole = requiredRoles.some((requiredRole) => {
            const comparison = user.role === requiredRole;
            this.logger.warn(`[RolesGuard Compare] Comparing user role '${user.role}' === required role '${requiredRole}' -> ${comparison}`);
            return comparison;
        });
        if (!hasRole) {
            this.logger.error(`[RolesGuard Deny] User role "${user.role}" does not match ANY required roles [${requiredRoles.join(', ')}].`);
        }
        this.logger.log(`[RolesGuard Result] Access ${hasRole ? 'Granted' : 'Denied'}`);
        return hasRole;
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = RolesGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RolesGuard);
//# sourceMappingURL=roles.guard.js.map