import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  ValidationPipe,
  Get,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Req,
  UnauthorizedException,
  Logger,
  SerializeOptions,
  UseInterceptors,
  ClassSerializerInterceptor,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Query,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty, ApiParam, ApiBody, ApiExtraModels, getSchemaPath, ApiQuery } from '@nestjs/swagger';
import { AssessmentService } from './assessment.service';
import { StartAssessmentDto } from 'src/dto/start-assessment.dto';
import { SubmitAnswerDto } from 'src/dto/submit-answer.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AssessmentSession } from 'src/entities/assessment_session.entity';
import { Question } from './entities/question.entity';
import { User as CurrentUser } from './decorators/user.decorator';
import { User } from 'src/entities/user.entity';
import { GetNextQuestionResponseDto, AssessmentResponseDto } from 'src/dto/assessment.dto';
import { SkillScoreDto } from 'src/dto/skill-score.dto';
import { GetUser } from 'src/auth/get-user.decorator';
import { AssessmentOwnerGuard } from 'src/auth/assessment-owner.guard';
import { StudentGuard } from 'src/auth/student.guard';
import { Request as ExpressRequest } from 'express';
import { ResponseWrapper } from 'src/common/wrappers/response.wrapper';
import { LegacyResponseInterceptor } from 'src/common/interceptors/legacy-response.interceptor';
import { createHybridResponse } from 'src/common/utils/response-helper';
import { MessagingService } from './messaging/messaging.service';
import { FinishSessionDto } from './dto/finish-session.dto';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: string;
  };
}

@ApiTags('Assessment')
@ApiBearerAuth()
@Controller('assessment')
@UseGuards(JwtAuthGuard)
@UseInterceptors(LegacyResponseInterceptor)
@ApiExtraModels(ResponseWrapper, AssessmentSession, AssessmentResponseDto, GetNextQuestionResponseDto, SkillScoreDto)
export class AssessmentController {
  private readonly logger = new Logger(AssessmentController.name);

  constructor(
    private readonly assessmentService: AssessmentService,
    private readonly messagingService: MessagingService,
  ) {}

  @Post('start')
  @ApiOperation({ 
    summary: 'Start a new assessment session',
    description: 'Initializes a new assessment session for the authenticated user. The session contains randomly selected questions for the specified skill.'
  })
  @ApiBody({
    type: StartAssessmentDto,
    description: 'The skill ID for which to start the assessment',
    examples: {
      skillIdExample: {
        value: { skillId: '00000000-0000-0000-0000-000000000000' },
        summary: 'Example of a valid skill ID'
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Assessment session started successfully.',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseWrapper) },
        {
          properties: {
            data: { $ref: getSchemaPath(AssessmentSession) }
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
  })
  @ApiResponse({ 
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
  })
  @ApiResponse({ 
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
  })
  @ApiResponse({ 
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
  })
  async startAssessment(
    @Req() req: ExpressRequest, 
    @Body(new ValidationPipe({ whitelist: true })) startAssessmentDto: StartAssessmentDto
  ): Promise<ResponseWrapper<AssessmentSession>> {
    const userId = (req.user as any)?.id;
    this.logger.log(`[Controller] Start assessment request received for user ${userId}. DTO: ${JSON.stringify(startAssessmentDto)}`);
    
    if (!userId) {
      this.logger.error('[Controller] User ID not found on request in startAssessment');
      throw new UnauthorizedException();
    }
    
    try {
      const result = await this.assessmentService.startAssessment(userId, startAssessmentDto);
      this.logger.log(`[Controller] Assessment started successfully for user ${userId}. Session ID: ${result.id}`);
      return ResponseWrapper.success(
        result,
        'Assessment session started successfully'
      );
    } catch (error) {
      this.logger.error(`[Controller] Error starting assessment for user ${userId}. DTO: ${JSON.stringify(startAssessmentDto)}. Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('submit')
  @UseGuards(JwtAuthGuard, StudentGuard)
  @ApiOperation({
    summary: 'Submit an answer for an assessment',
    description: 'Submits a user\'s answer for a specific question in an assessment session. Returns the result indicating whether the answer was correct.'
  })
  @ApiBody({
    type: SubmitAnswerDto,
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
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Answer recorded successfully with correctness evaluation.',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseWrapper) },
        {
          properties: {
            data: { $ref: getSchemaPath(AssessmentResponseDto) },
            // Hybrid response properties
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
  })
  @ApiResponse({ 
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
  })
  @ApiResponse({ 
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
  })
  @ApiResponse({ 
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
  })
  @ApiResponse({ 
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
  })
  @HttpCode(HttpStatus.OK)
  async submitAnswer(
    @GetUser() user: User,
    @Body() submitDto: SubmitAnswerDto,
  ): Promise<ResponseWrapper<AssessmentResponseDto>> {
    this.logger.log(`[AssessmentController] submitAnswer for user ${user.id}, session ${submitDto.assessmentSessionId}, question ${submitDto.questionId}`);
    
    try {
      const result = await this.assessmentService.submitAnswer(
        user.id,
        submitDto
      );

      this.logger.log(`[AssessmentController] submitAnswer service result: ${JSON.stringify(result)}`);
      
      // Create a hybrid response with both legacy and new format properties
      // IMPORTANT: Pass result.isCorrect directly as the third parameter (boolean)
      // rather than as an object { correct: result.isCorrect } which would add
      // an unwanted 'correct' property to the response
      return createHybridResponse(
        result,
        result.isCorrect ? 'Answer submitted correctly' : 'Answer submitted but incorrect',
        result.isCorrect // Pass boolean directly instead of { correct: result.isCorrect }
      );
    } catch (error) {
      this.logger.error(`[AssessmentController] submitAnswer error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('submit-async')
  @ApiOperation({ summary: 'Submit an answer asynchronously using RabbitMQ' })
  @ApiResponse({ 
    status: 202, 
    description: 'Answer submitted for processing', 
    type: ResponseWrapper 
  })
  @UseGuards(JwtAuthGuard)
  async submitAnswerAsync(
    @Body() submitAnswerDto: SubmitAnswerDto,
    @Request() req,
  ) {
    try {
      this.logger.log(`Submitting answer asynchronously: ${JSON.stringify(submitAnswerDto)}`);
      
      // Emit event to RabbitMQ for async processing
      await this.messagingService.emitEvent('process_assessment_response', {
        userId: req.user.id,
        assessmentSessionId: submitAnswerDto.assessmentSessionId,
        questionId: submitAnswerDto.questionId,
        userResponse: submitAnswerDto.userResponse,
      });
      
      // Return an immediate response
      return createHybridResponse({
        message: 'Answer submitted for processing',
      }, "Operation succeeded", true);
      
    } catch (error) {
      this.logger.error(`Error emitting assessment event: ${error.message}`, error.stack);
      throw new HttpException(
        createHybridResponse({
          message: `Error submitting answer: ${error.message}`,
        }, false),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('finish-session-async')
  @ApiOperation({ summary: 'Finish session asynchronously using RabbitMQ' })
  @ApiResponse({ 
    status: 202, 
    description: 'Session completion queued for processing', 
    type: ResponseWrapper 
  })
  @UseGuards(JwtAuthGuard)
  async finishSessionAsync(
    @Body() finishSessionDto: FinishSessionDto,
    @Request() req,
  ) {
    try {
      this.logger.log(`Finishing session asynchronously: ${JSON.stringify(finishSessionDto)}`);
      
      // Send message to RabbitMQ for async processing
      await this.messagingService.emitEvent('finish_assessment_session', {
        userId: req.user.id,
        assessmentSessionId: finishSessionDto.assessmentSessionId,
      });
      
      // Return an immediate response
      return createHybridResponse({
        message: 'Session completion queued for processing',
      }, "Operation succeeded", true);
      
    } catch (error) {
      this.logger.error(`Error emitting finish session event: ${error.message}`, error.stack);
      throw new HttpException(
        createHybridResponse({
          message: `Error finishing session: ${error.message}`,
        }, false),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':sessionId/next')
  @UseGuards(JwtAuthGuard, AssessmentOwnerGuard)
  @ApiOperation({
    summary: 'Get the next question for an assessment session',
    description: 'Retrieves the next unanswered question for the specified assessment session. If all questions have been answered, returns completion status.'
  })
  @ApiParam({
    name: 'sessionId',
    description: 'The UUID of the assessment session',
    type: 'string',
    format: 'uuid',
    example: '00000000-0000-0000-0000-000000000000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Next question retrieved or completion status.',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseWrapper) },
        {
          properties: {
            data: { $ref: getSchemaPath(GetNextQuestionResponseDto) }
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
  })
  @ApiResponse({ 
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
  })
  @ApiResponse({ 
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
  })
  @ApiResponse({ 
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
  })
  async getNextQuestion(
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @GetUser() user: User,
  ): Promise<ResponseWrapper<GetNextQuestionResponseDto>> {
    this.logger.log(`[Controller] GetNextQuestion request for session ${sessionId} by user ${user.id}`);
    try {
      const result = await this.assessmentService.getNextQuestion(user.id, sessionId);
      this.logger.log(`[Controller] GetNextQuestion completed for session ${sessionId}. isComplete: ${result.isComplete}`);
      
      // Directly use the standard ResponseWrapper format (no hybrid)
      return ResponseWrapper.success(
        result,
        result.isComplete 
          ? 'Assessment session is complete' 
          : 'Next question retrieved'
      );
    } catch (error) {
      this.logger.error(`[Controller] Error getting next question for session ${sessionId}. Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':sessionId/result')
  @UseGuards(JwtAuthGuard, AssessmentOwnerGuard)
  @ApiOperation({
    summary: 'Get the result of a completed assessment session',
    description: 'Retrieves the final score and level achieved for a completed assessment session.'
  })
  @ApiParam({
    name: 'sessionId',
    description: 'The UUID of the completed assessment session',
    type: 'string',
    format: 'uuid',
    example: '00000000-0000-0000-0000-000000000000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Assessment result retrieved successfully.',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ResponseWrapper) },
        {
          properties: {
            data: { $ref: getSchemaPath(SkillScoreDto) }
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
  })
  @ApiResponse({ 
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
  })
  @ApiResponse({ 
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
  })
  @ApiResponse({ 
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
  })
  @ApiResponse({ 
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
  })
  async getSessionResult(
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @GetUser() user: User,
  ): Promise<ResponseWrapper<SkillScoreDto>> {
    this.logger.log(`[Controller] GetSessionResult request for session ${sessionId} by user ${user.id}`);
    try {
      const result = await this.assessmentService.getSessionResult(user.id, sessionId);
      this.logger.log(`[Controller] GetSessionResult completed for session ${sessionId}. Score: ${result.score}`);
      
      // Directly use the standard ResponseWrapper format (no hybrid)
      return ResponseWrapper.success(
        result,
        `Assessment completed with score: ${result.score}, level: ${result.level}`
      );
    } catch (error) {
      this.logger.error(`[Controller] Error getting result for session ${sessionId}. Error: ${error.message}`, error.stack);
      throw error;
    }
  }
}
