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
var SkillsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillsController = void 0;
const common_1 = require("@nestjs/common");
const skills_service_1 = require("./skills.service");
const create_skill_dto_1 = require("./dto/create-skill.dto");
const update_skill_dto_1 = require("./dto/update-skill.dto");
const jwt_auth_guard_1 = require("./auth/jwt-auth.guard");
const roles_guard_1 = require("./guards/roles.guard");
const roles_decorator_1 = require("./decorators/roles.decorator");
const user_entity_1 = require("./entities/user.entity");
const swagger_1 = require("@nestjs/swagger");
const skill_entity_1 = require("./entities/skill.entity");
let SkillsController = SkillsController_1 = class SkillsController {
    constructor(skillsService) {
        this.skillsService = skillsService;
        this.logger = new common_1.Logger(SkillsController_1.name);
    }
    create(createSkillDto) {
        this.logger.log(`Received request to create skill: ${createSkillDto.name}`);
        return this.skillsService.create(createSkillDto);
    }
    findAll() {
        this.logger.log('Received request to find all skills');
        return this.skillsService.findAll();
    }
    findOne(id) {
        this.logger.log(`Received request to find skill with ID: ${id}`);
        return this.skillsService.findOne(id);
    }
    update(id, updateSkillDto) {
        this.logger.log(`Received request to update skill with ID: ${id}`);
        return this.skillsService.update(id, updateSkillDto);
    }
    remove(id) {
        this.logger.log(`Received request to remove skill with ID: ${id}`);
        return this.skillsService.remove(id);
    }
};
exports.SkillsController = SkillsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new skill (Admin Only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Skill created.', type: skill_entity_1.Skill }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad Request - Validation failed.' }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_skill_dto_1.CreateSkillDto]),
    __metadata("design:returntype", Promise)
], SkillsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all skills' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of skills.',
        type: skill_entity_1.Skill,
        isArray: true
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SkillsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single skill by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'Skill ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Skill details.', type: skill_entity_1.Skill }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Skill not found.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SkillsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update a skill (Admin Only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'Skill ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Skill updated.', type: skill_entity_1.Skill }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Skill not found.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad Request - Validation failed.' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_skill_dto_1.UpdateSkillDto]),
    __metadata("design:returntype", Promise)
], SkillsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a skill (Admin Only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'Skill ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Skill deleted.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Skill not found.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SkillsController.prototype, "remove", null);
exports.SkillsController = SkillsController = SkillsController_1 = __decorate([
    (0, swagger_1.ApiTags)('Skills'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('skills'),
    __metadata("design:paramtypes", [skills_service_1.SkillsService])
], SkillsController);
//# sourceMappingURL=skills.controller.js.map