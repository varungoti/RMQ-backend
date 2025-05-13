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
const assessment_service_1 = require("./assessment.service");
const start_assessment_dto_1 = require("./dto/start-assessment.dto");
const submit_answer_dto_1 = require("./dto/submit-answer.dto");
const jwt_auth_guard_1 = require("./auth/jwt-auth.guard");
const assessment_session_entity_1 = require("./entities/assessment_session.entity");
const user_entity_1 = require("./entities/user.entity");
const assessment_dto_1 = require("./dto/assessment.dto");
const skill_score_dto_1 = require("./dto/skill-score.dto");
const get_user_decorator_1 = require("./auth/get-user.decorator");
const assessment_owner_guard_1 = require("./auth/assessment-owner.guard");
const student_guard_1 = require("./auth/student.guard");
const response_wrapper_1 = require("./common/wrappers/response.wrapper");
const legacy_response_interceptor_1 = require("./common/interceptors/legacy-response.interceptor");
const response_helper_1 = require("./common/utils/response-helper");
const messaging_service_1 = require("./messaging/messaging.service");
const finish_session_dto_1 = require("./dto/finish-session.dto");
let AssessmentController = AssessmentController_1 = class AssessmentController {
    constructor(assessmentService, messagingService) {
        this.assessmentService = assessmentService;
        this.messagingService = messagingService;
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
    async submitAnswer(user, submitDto) {
        this.logger.log(`[AssessmentController] submitAnswer for user ${user.id}, session ${submitDto.assessmentSessionId}, question ${submitDto.questionId}`);
        try {
            const result = await this.assessmentService.submitAnswer(user.id, submitDto);
            this.logger.log(`[AssessmentController] submitAnswer service result: ${JSON.stringify(result)}`);
            return (0, response_helper_1.createHybridResponse)(result, result.isCorrect ? 'Answer submitted correctly' : 'Answer submitted but incorrect', result.isCorrect);
        }
        catch (error) {
            this.logger.error(`[AssessmentController] submitAnswer error: ${error.message}`, error.stack);
            throw error;
        }
    }
    async submitAnswerAsync(submitAnswerDto, req) {
        try {
            this.logger.log(`Submitting answer asynchronously: ${JSON.stringify(submitAnswerDto)}`);
            await this.messagingService.emitEvent('process_assessment_response', {
                userId: req.user.id,
                assessmentSessionId: submitAnswerDto.assessmentSessionId,
                questionId: submitAnswerDto.questionId,
                userResponse: submitAnswerDto.userResponse,
            });
            return (0, response_helper_1.createHybridResponse)({
                message: 'Answer submitted for processing',
            }, "Operation succeeded", true);
        }
        catch (error) {
            this.logger.error(`Error emitting assessment event: ${error.message}`, error.stack);
            throw new common_1.HttpException((0, response_helper_1.createHybridResponse)({
                message: `Error submitting answer: ${error.message}`,
            }, false), common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async finishSessionAsync(finishSessionDto, req) {
        try {
            this.logger.log(`Finishing session asynchronously: ${JSON.stringify(finishSessionDto)}`);
            await this.messagingService.emitEvent('finish_assessment_session', {
                userId: req.user.id,
                assessmentSessionId: finishSessionDto.assessmentSessionId,
            });
            return (0, response_helper_1.createHybridResponse)({
                message: 'Session completion queued for processing',
            }, "Operation succeeded", true);
        }
        catch (error) {
            this.logger.error(`Error emitting finish session event: ${error.message}`, error.stack);
            throw new common_1.HttpException((0, response_helper_1.createHybridResponse)({
                message: `Error finishing session: ${error.message}`,
            }, false), common_1.HttpStatus.INTERNAL_SERVER_ERROR);
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
    (0, swagger_1.ApiOperation)({
        summary: 'Start a new assessment session',
        description: 'Initializes a new assessment session for the authenticated user. The session contains randomly selected questions for the specified skill.'
    }),
    (0, swagger_1.ApiBody)({
        type: start_assessment_dto_1.StartAssessmentDto,
        description: 'The skill ID for which to start the assessment',
        examples: {
            skillIdExample: {
                value: { skillId: '00000000-0000-0000-0000-000000000000' },
                summary: 'Example of a valid skill ID'
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Assessment session started successfully.',
        schema: {
            allOf: [
                { $ref: (0, swagger_1.getSchemaPath)(response_wrapper_1.ResponseWrapper) },
                {
                    properties: {
                        data: { $ref: (0, swagger_1.getSchemaPath)(assessment_session_entity_1.AssessmentSession) }
                    }
                }
            ]
        },
        content: {
            'application/json': {
                example: {
                    success: true,
                    message: 'Assessment session started successfully',
                    data: {
                        id: '12345678-1234-1234-1234-123456789012',
                        status: 'in_progress',
                        startedAt: '2023-01-01T00:00:00.000Z',
                        questionIds: ['q1', 'q2', 'q3']
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad Request - Invalid skill ID or other validation error',
        content: {
            'application/json': {
                example: {
                    success: false,
                    message: 'Invalid skill ID format',
                    errors: ['skillId must be a UUID']
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - Invalid or missing authentication token',
        content: {
            'application/json': {
                example: {
                    statusCode: 401,
                    message: 'Unauthorized'
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Not Found - Specified skill does not exist',
        content: {
            'application/json': {
                example: {
                    success: false,
                    message: 'Skill not found',
                    statusCode: 404
                }
            }
        }
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, start_assessment_dto_1.StartAssessmentDto]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "startAssessment", null);
__decorate([
    (0, common_1.Post)('submit'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, student_guard_1.StudentGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Submit an answer for an assessment',
        description: 'Submits a user\'s answer for a specific question in an assessment session. Returns the result indicating whether the answer was correct.'
    }),
    (0, swagger_1.ApiBody)({
        type: submit_answer_dto_1.SubmitAnswerDto,
        description: 'The answer submission details',
        examples: {
            validAnswer: {
                value: {
                    assessmentSessionId: '00000000-0000-0000-0000-000000000000',
                    questionId: '00000000-0000-0000-0000-000000000001',
                    userResponse: 'A'
                },
                summary: 'Example of a valid answer submission'
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Answer recorded successfully with correctness evaluation.',
        schema: {
            allOf: [
                { $ref: (0, swagger_1.getSchemaPath)(response_wrapper_1.ResponseWrapper) },
                {
                    properties: {
                        data: { $ref: (0, swagger_1.getSchemaPath)(assessment_dto_1.AssessmentResponseDto) },
                        success: { type: 'boolean' },
                        isCorrect: { type: 'boolean' },
                        message: { type: 'string' },
                    }
                }
            ]
        },
        content: {
            'application/json': {
                example: {
                    id: '12345678-1234-5678-1234-567812345678',
                    userResponse: 'A',
                    isCorrect: true,
                    answeredAt: '2023-01-01T00:00:00.000Z',
                    assessmentSession: {
                        id: '00000000-0000-0000-0000-000000000000',
                        status: 'in_progress'
                    },
                    question: {
                        id: '00000000-0000-0000-0000-000000000001',
                        questionText: 'What is 2+2?',
                        questionType: 'multiple_choice',
                        options: { A: '4', B: '3', C: '5', D: '2' }
                    },
                    success: true,
                    message: 'Answer submitted correctly'
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad request - Missing required fields, invalid format, or question already answered.',
        content: {
            'application/json': {
                example: {
                    success: false,
                    message: 'Question has already been answered for this session',
                    statusCode: 400
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - Invalid or missing authentication token',
        content: {
            'application/json': {
                example: {
                    statusCode: 401,
                    message: 'Unauthorized'
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden - User does not own the session or is not a student',
        content: {
            'application/json': {
                example: {
                    success: false,
                    message: 'You do not own this assessment session',
                    statusCode: 403
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Not Found - Session or question does not exist',
        content: {
            'application/json': {
                example: {
                    success: false,
                    message: 'Assessment session not found',
                    statusCode: 404
                }
            }
        }
    }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User,
        submit_answer_dto_1.SubmitAnswerDto]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "submitAnswer", null);
__decorate([
    (0, common_1.Post)('submit-async'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit an answer asynchronously using RabbitMQ' }),
    (0, swagger_1.ApiResponse)({
        status: 202,
        description: 'Answer submitted for processing',
        type: response_wrapper_1.ResponseWrapper
    }),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [submit_answer_dto_1.SubmitAnswerDto, Object]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "submitAnswerAsync", null);
__decorate([
    (0, common_1.Post)('finish-session-async'),
    (0, swagger_1.ApiOperation)({ summary: 'Finish session asynchronously using RabbitMQ' }),
    (0, swagger_1.ApiResponse)({
        status: 202,
        description: 'Session completion queued for processing',
        type: response_wrapper_1.ResponseWrapper
    }),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finish_session_dto_1.FinishSessionDto, Object]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "finishSessionAsync", null);
__decorate([
    (0, common_1.Get)(':sessionId/next'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, assessment_owner_guard_1.AssessmentOwnerGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Get the next question for an assessment session',
        description: 'Retrieves the next unanswered question for the specified assessment session. If all questions have been answered, returns completion status.'
    }),
    (0, swagger_1.ApiParam)({
        name: 'sessionId',
        description: 'The UUID of the assessment session',
        type: 'string',
        format: 'uuid',
        example: '00000000-0000-0000-0000-000000000000'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Next question retrieved or completion status.',
        schema: {
            allOf: [
                { $ref: (0, swagger_1.getSchemaPath)(response_wrapper_1.ResponseWrapper) },
                {
                    properties: {
                        data: { $ref: (0, swagger_1.getSchemaPath)(assessment_dto_1.GetNextQuestionResponseDto) }
                    }
                }
            ]
        },
        content: {
            'application/json': {
                examples: {
                    nextQuestion: {
                        value: {
                            success: true,
                            message: 'Next question retrieved',
                            data: {
                                isComplete: false,
                                nextQuestion: {
                                    id: '00000000-0000-0000-0000-000000000001',
                                    questionText: 'What is 2+2?',
                                    type: 'multiple_choice',
                                    options: { A: '4', B: '3', C: '5', D: '2' },
                                    difficultyLevel: 1
                                }
                            }
                        },
                        summary: 'Example when next question is available'
                    },
                    completed: {
                        value: {
                            success: true,
                            message: 'Assessment session is complete',
                            data: {
                                isComplete: true,
                                nextQuestion: null
                            }
                        },
                        summary: 'Example when session is complete'
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - Invalid or missing authentication token',
        content: {
            'application/json': {
                example: {
                    statusCode: 401,
                    message: 'Unauthorized'
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden - User does not own the session',
        content: {
            'application/json': {
                example: {
                    success: false,
                    message: 'You do not own this assessment session',
                    statusCode: 403
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Not Found - Session does not exist',
        content: {
            'application/json': {
                example: {
                    success: false,
                    message: 'Assessment session not found',
                    statusCode: 404
                }
            }
        }
    }),
    __param(0, (0, common_1.Param)('sessionId', new common_1.ParseUUIDPipe())),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "getNextQuestion", null);
__decorate([
    (0, common_1.Get)(':sessionId/result'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, assessment_owner_guard_1.AssessmentOwnerGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Get the result of a completed assessment session',
        description: 'Retrieves the final score and level achieved for a completed assessment session.'
    }),
    (0, swagger_1.ApiParam)({
        name: 'sessionId',
        description: 'The UUID of the completed assessment session',
        type: 'string',
        format: 'uuid',
        example: '00000000-0000-0000-0000-000000000000'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Assessment result retrieved successfully.',
        schema: {
            allOf: [
                { $ref: (0, swagger_1.getSchemaPath)(response_wrapper_1.ResponseWrapper) },
                {
                    properties: {
                        data: { $ref: (0, swagger_1.getSchemaPath)(skill_score_dto_1.SkillScoreDto) }
                    }
                }
            ]
        },
        content: {
            'application/json': {
                example: {
                    success: true,
                    message: 'Assessment completed with score: 85, level: 4',
                    data: {
                        id: '12345678-1234-5678-1234-567812345678',
                        userId: '00000000-0000-0000-0000-000000000000',
                        skillId: '00000000-0000-0000-0000-000000000001',
                        score: 85,
                        level: 4,
                        lastAssessedAt: '2023-01-01T00:00:00.000Z'
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad request - Assessment is not yet completed',
        content: {
            'application/json': {
                example: {
                    success: false,
                    message: 'Assessment session is not completed yet',
                    statusCode: 400
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - Invalid or missing authentication token',
        content: {
            'application/json': {
                example: {
                    statusCode: 401,
                    message: 'Unauthorized'
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden - User does not own the session',
        content: {
            'application/json': {
                example: {
                    success: false,
                    message: 'You do not own this assessment session',
                    statusCode: 403
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Not Found - Session does not exist',
        content: {
            'application/json': {
                example: {
                    success: false,
                    message: 'Assessment session not found',
                    statusCode: 404
                }
            }
        }
    }),
    __param(0, (0, common_1.Param)('sessionId', new common_1.ParseUUIDPipe())),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "getSessionResult", null);
exports.AssessmentController = AssessmentController = AssessmentController_1 = __decorate([
    (0, swagger_1.ApiTags)('Assessment'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('assessment'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)(legacy_response_interceptor_1.LegacyResponseInterceptor),
    (0, swagger_1.ApiExtraModels)(response_wrapper_1.ResponseWrapper, assessment_session_entity_1.AssessmentSession, assessment_dto_1.AssessmentResponseDto, assessment_dto_1.GetNextQuestionResponseDto, skill_score_dto_1.SkillScoreDto),
    __metadata("design:paramtypes", [assessment_service_1.AssessmentService,
        messaging_service_1.MessagingService])
], AssessmentController);
//# sourceMappingURL=assessment.controller.js.map