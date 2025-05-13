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
var QuestionsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionsController = void 0;
const common_1 = require("@nestjs/common");
const questions_service_1 = require("./questions.service");
const question_dto_1 = require("./dto/question.dto");
const question_dto_2 = require("./dto/question.dto");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("./auth/jwt-auth.guard");
const roles_guard_1 = require("./guards/roles.guard");
const roles_decorator_1 = require("./decorators/roles.decorator");
const user_entity_1 = require("./entities/user.entity");
const question_entity_1 = require("./entities/question.entity");
let QuestionsController = QuestionsController_1 = class QuestionsController {
    constructor(questionsService) {
        this.questionsService = questionsService;
        this.logger = new common_1.Logger(QuestionsController_1.name);
    }
    create(createQuestionDto) {
        this.logger.log(`Received request to create question`);
        return this.questionsService.create(createQuestionDto);
    }
    findAll() {
        this.logger.log(`Received request to get all questions`);
        return this.questionsService.findAll();
    }
    findOne(id) {
        this.logger.log(`Received request to get question ID: ${id}`);
        return this.questionsService.findOne(id);
    }
    update(id, updateQuestionDto) {
        this.logger.log(`Received request to update question ID: ${id}`);
        return this.questionsService.update(id, updateQuestionDto);
    }
    remove(id) {
        this.logger.log(`Received request to delete question ID: ${id}`);
        return this.questionsService.remove(id);
    }
};
exports.QuestionsController = QuestionsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new question (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'The question has been successfully created.', type: question_entity_1.Question }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad Request (validation error)' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden (user is not Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not Found (associated Skill not found)' }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [question_dto_1.CreateQuestionDto]),
    __metadata("design:returntype", Promise)
], QuestionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all questions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of all questions', type: [question_entity_1.Question] }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], QuestionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific question by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string', format: 'uuid', description: 'Question UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'The found question', type: question_entity_1.Question }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Question not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QuestionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update a question (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string', format: 'uuid', description: 'Question UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'The updated question', type: question_entity_1.Question }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad Request (validation error)' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden (user is not Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Question or associated Skill not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, question_dto_2.UpdateQuestionDto]),
    __metadata("design:returntype", Promise)
], QuestionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a question (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string', format: 'uuid', description: 'Question UUID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Question successfully deleted' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden (user is not Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Question not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QuestionsController.prototype, "remove", null);
exports.QuestionsController = QuestionsController = QuestionsController_1 = __decorate([
    (0, swagger_1.ApiTags)('Questions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('questions'),
    __metadata("design:paramtypes", [questions_service_1.QuestionsService])
], QuestionsController);
//# sourceMappingURL=questions.controller.js.map