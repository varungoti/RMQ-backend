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
var MessagingController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingController = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const swagger_1 = require("@nestjs/swagger");
const assessment_service_1 = require("../assessment.service");
const process_assessment_response_dto_1 = require("./dto/process-assessment-response.dto");
const finish_assessment_session_dto_1 = require("./dto/finish-assessment-session.dto");
const assessment_message_response_dto_1 = require("./dto/assessment-message-response.dto");
let MessagingController = MessagingController_1 = class MessagingController {
    constructor(assessmentService) {
        this.assessmentService = assessmentService;
        this.logger = new common_1.Logger(MessagingController_1.name);
    }
    async processAssessmentResponse(data, context) {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        this.logger.log(`Processing assessment response: ${JSON.stringify(data)}`);
        try {
            const submitAnswerDto = {
                assessmentSessionId: data.assessmentSessionId,
                questionId: data.questionId,
                userResponse: data.userResponse,
            };
            const result = await this.assessmentService.submitAnswer(data.userId, submitAnswerDto);
            channel.ack(originalMsg);
            return {
                success: true,
                message: 'Assessment response processed successfully',
                ...result
            };
        }
        catch (error) {
            this.logger.error(`Error processing assessment response: ${error.message}`, error.stack);
            if (error.name === 'ValidationError' || error.name === 'BusinessError') {
                channel.ack(originalMsg);
                return {
                    success: false,
                    message: error.message,
                    error: {
                        code: error.name,
                        details: error.message
                    }
                };
            }
            channel.reject(originalMsg, true);
            return {
                success: false,
                message: 'Error processing assessment response',
                error: {
                    code: 'PROCESSING_ERROR',
                    details: error.message
                }
            };
        }
    }
    async finishAssessmentSession(data, context) {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        this.logger.log(`Finishing assessment session: ${JSON.stringify(data)}`);
        try {
            const result = await this.assessmentService.calculateOverallScore(data.assessmentSessionId);
            channel.ack(originalMsg);
            return {
                success: true,
                assessmentSessionId: data.assessmentSessionId,
                score: result.score,
                level: result.level
            };
        }
        catch (error) {
            this.logger.error(`Error finishing assessment session: ${error.message}`, error.stack);
            if (error.name === 'ValidationError' || error.name === 'BusinessError') {
                channel.ack(originalMsg);
                return {
                    success: false,
                    message: error.message,
                    error: {
                        code: error.name,
                        details: error.message
                    }
                };
            }
            channel.reject(originalMsg, true);
            return {
                success: false,
                message: 'Error finishing assessment session',
                error: {
                    code: 'PROCESSING_ERROR',
                    details: error.message
                }
            };
        }
    }
};
exports.MessagingController = MessagingController;
__decorate([
    (0, microservices_1.MessagePattern)('process_assessment_response'),
    (0, swagger_1.ApiOperation)({
        summary: 'Process assessment response via RabbitMQ',
        description: 'Handles the asynchronous processing of assessment responses.'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Assessment response processed successfully',
        type: assessment_message_response_dto_1.AssessmentMessageResponseDto
    }),
    __param(0, (0, microservices_1.Payload)(new common_1.ValidationPipe())),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [process_assessment_response_dto_1.ProcessAssessmentResponseDto,
        microservices_1.RmqContext]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "processAssessmentResponse", null);
__decorate([
    (0, microservices_1.MessagePattern)('finish_assessment_session'),
    (0, swagger_1.ApiOperation)({
        summary: 'Finish assessment session via RabbitMQ',
        description: 'Handles the asynchronous completion of assessment sessions.'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Assessment session finished successfully',
        type: assessment_message_response_dto_1.AssessmentSessionResultDto
    }),
    __param(0, (0, microservices_1.Payload)(new common_1.ValidationPipe())),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finish_assessment_session_dto_1.FinishAssessmentSessionDto,
        microservices_1.RmqContext]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "finishAssessmentSession", null);
exports.MessagingController = MessagingController = MessagingController_1 = __decorate([
    (0, swagger_1.ApiTags)('Messaging'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [assessment_service_1.AssessmentService])
], MessagingController);
//# sourceMappingURL=messaging.controller.js.map