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
var AssessmentController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const assessment_service_1 = require("./assessment.service");
const start_assessment_dto_1 = require("../dto/start-assessment.dto");
const submit_answer_dto_1 = require("../dto/submit-answer.dto");
const get_user_decorator_1 = require("../auth/get-user.decorator");
const user_entity_1 = require("../entities/user.entity");
const assessment_owner_guard_1 = require("../auth/assessment-owner.guard");
const student_guard_1 = require("../auth/student.guard");
const response_wrapper_1 = require("../common/wrappers/response.wrapper");
const legacy_response_interceptor_1 = require("../common/interceptors/legacy-response.interceptor");
const response_helper_1 = require("../common/utils/response-helper");
const submit_answer_response_dto_1 = require("../dto/submit-answer-response.dto");
let AssessmentController = AssessmentController_1 = class AssessmentController {
    constructor(assessmentService) {
        this.assessmentService = assessmentService;
        this.logger = new common_1.Logger(AssessmentController_1.name);
    }
    async startAssessment(req, startAssessmentDto) {
        const userId = req.user?.id;
        this.logger.log(`[Controller] Start assessment request received for user ${userId}. DTO: ${JSON.stringify(startAssessmentDto)}`);
        if (!userId) {
            this.logger.error('[Controller] User ID not found on request in startAssessment');
            throw new common_1.UnauthorizedException();
        }
        try {
            const result = await this.assessmentService.startAssessment(userId, startAssessmentDto);
            this.logger.log(`[Controller] Assessment started successfully for user ${userId}. Session ID: ${result.id}`);
            return response_wrapper_1.ResponseWrapper.success(result, 'Assessment session started successfully');
        }
        catch (error) {
            this.logger.error(`[Controller] Error starting assessment for user ${userId}. DTO: ${JSON.stringify(startAssessmentDto)}. Error: ${error.message}`, error.stack);
            throw error;
        }
    }
    async submitAnswer(submitDto, user) {
        try {
            this.logger.log(`[AssessmentController] submitAnswer attempt for session ${submitDto.assessmentSessionId}, question ${submitDto.questionId} by user ${user.id}`);
            const result = await this.assessmentService.submitAnswer(user.id, submitDto);
            this.logger.debug(`[AssessmentController] submitAnswer service result: ${JSON.stringify(result)}`);
            const message = result.isCorrect
                ? 'Answer submitted correctly'
                : 'Answer submitted but incorrect';
            return (0, response_helper_1.createHybridResponse)(result, message, result.isCorrect);
        }
        catch (error) {
            this.logger.error(`[AssessmentController] submitAnswer error: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getNextQuestion(sessionId, user) {
        this.logger.log(`[Controller] GetNextQuestion request for session ${sessionId} by user ${user.id}`);
        try {
            const result = await this.assessmentService.getNextQuestion(user.id, sessionId);
            this.logger.log(`[Controller] GetNextQuestion completed for session ${sessionId}. isComplete: ${result.isComplete}`);
            return response_wrapper_1.ResponseWrapper.success(result, result.isComplete
                ? 'Assessment session is complete'
                : 'Next question retrieved');
        }
        catch (error) {
            this.logger.error(`[Controller] Error getting next question for session ${sessionId}. Error: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getSessionResult(sessionId, user) {
        this.logger.log(`[Controller] GetSessionResult request for session ${sessionId} by user ${user.id}`);
        try {
            const result = await this.assessmentService.getSessionResult(user.id, sessionId);
            this.logger.log(`[Controller] GetSessionResult completed for session ${sessionId}. Score: ${result.score}`);
            return response_wrapper_1.ResponseWrapper.success(result, `Assessment completed with score: ${result.score}, level: ${result.level}`);
        }
        catch (error) {
            this.logger.error(`[Controller] Error getting result for session ${sessionId}. Error: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.AssessmentController = AssessmentController;
__decorate([
    (0, common_1.Post)('start'),
    (0, swagger_1.ApiOperation)({ summary: 'Start a new assessment session' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Assessment session started.',
        type: (response_wrapper_1.ResponseWrapper)
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad Request (e.g., invalid skill ID)' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Skill not found' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, start_assessment_dto_1.StartAssessmentDto]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "startAssessment", null);
__decorate([
    (0, common_1.Post)('submit'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, student_guard_1.StudentGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Submit answer for an assessment question' }),
    (0, swagger_1.ApiBody)({ type: submit_answer_dto_1.SubmitAnswerDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Answer submitted successfully. Returns result of submission with details.',
        schema: {
            oneOf: [
                { $ref: (0, swagger_1.getSchemaPath)(submit_answer_response_dto_1.SubmitAnswerResponseDto) },
                { $ref: (0, swagger_1.getSchemaPath)(response_wrapper_1.ResponseWrapper) }
            ]
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request (e.g., invalid input, question already answered).' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden (User does not own the session).' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session or question not found.' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [submit_answer_dto_1.SubmitAnswerDto,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "submitAnswer", null);
__decorate([
    (0, common_1.Get)('session/:id/next'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, assessment_owner_guard_1.AssessmentOwnerGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get the next question for an assessment session' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Assessment session ID', type: 'string', format: 'uuid' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Next question retrieved.',
        type: (response_wrapper_1.ResponseWrapper)
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden (User does not own the session).' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found.' }),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "getNextQuestion", null);
__decorate([
    (0, common_1.Get)('session/:id/result'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, assessment_owner_guard_1.AssessmentOwnerGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get the result of a completed assessment session' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Assessment session ID', type: 'string', format: 'uuid' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Assessment result retrieved.',
        type: (response_wrapper_1.ResponseWrapper)
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request (e.g., assessment not completed).' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden (User does not own the session).' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found.' }),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "getSessionResult", null);
exports.AssessmentController = AssessmentController = AssessmentController_1 = __decorate([
    (0, swagger_1.ApiTags)('Assessment'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('assessment'),
    (0, common_1.UseInterceptors)(legacy_response_interceptor_1.LegacyResponseInterceptor),
    __metadata("design:paramtypes", [assessment_service_1.AssessmentService])
], AssessmentController);
//# sourceMappingURL=assessment.controller.js.map