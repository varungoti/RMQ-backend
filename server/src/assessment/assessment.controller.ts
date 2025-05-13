import {
  Controller,
  Post,
  Get,
  Body,
  ValidationPipe,
  Req,
  UnauthorizedException,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Logger,
  SerializeOptions,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, getSchemaPath } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AssessmentService } from './assessment.service';
import { StartAssessmentDto } from 'src/dto/start-assessment.dto';
import { AssessmentSession } from 'src/entities/assessment_session.entity';
import { SubmitAnswerDto } from 'src/dto/submit-answer.dto';
import { AssessmentResponse } from 'src/entities/assessment_response.entity';
import { GetNextQuestionResponseDto, AssessmentResponseDto } from 'src/dto/assessment.dto';
import { SkillScoreDto } from 'src/dto/skill-score.dto';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/entities/user.entity';
import { AssessmentOwnerGuard } from 'src/auth/assessment-owner.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { StudentGuard } from 'src/auth/student.guard';
import { Request } from 'express';
import { ResponseWrapper } from 'src/common/wrappers/response.wrapper';
import { LegacyResponseInterceptor } from 'src/common/interceptors/legacy-response.interceptor';
import { createHybridResponse } from 'src/common/utils/response-helper';
import { HybridResponse } from 'src/common/types/hybrid-response.type';
import { SubmitAnswerResponseDto } from 'src/dto/submit-answer-response.dto';

@ApiTags('Assessment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('assessment')
@UseInterceptors(LegacyResponseInterceptor)
export class AssessmentController {
  private readonly logger = new Logger(AssessmentController.name);

  constructor(private readonly assessmentService: AssessmentService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new assessment session' })
  @ApiResponse({ 
    status: 201, 
    description: 'Assessment session started.',
    type: ResponseWrapper<AssessmentSession>
  })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., invalid skill ID)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  async startAssessment(
    @Req() req: Request, 
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
  @ApiOperation({ summary: 'Submit answer for an assessment question' })
  @ApiBody({ type: SubmitAnswerDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Answer submitted successfully. Returns result of submission with details.',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(SubmitAnswerResponseDto) },
        { $ref: getSchemaPath(ResponseWrapper) }
      ]
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request (e.g., invalid input, question already answered).' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (User does not own the session).' })
  @ApiResponse({ status: 404, description: 'Session or question not found.' })
  async submitAnswer(
    @Body() submitDto: SubmitAnswerDto,
    @GetUser() user: User,
  ): Promise<any> {
    try {
      this.logger.log(`[AssessmentController] submitAnswer attempt for session ${submitDto.assessmentSessionId}, question ${submitDto.questionId} by user ${user.id}`);
      
      const result = await this.assessmentService.submitAnswer(
        user.id,
        submitDto
      );

      this.logger.debug(`[AssessmentController] submitAnswer service result: ${JSON.stringify(result)}`);
      
      // Use the createHybridResponse helper function
      const message = result.isCorrect 
        ? 'Answer submitted correctly' 
        : 'Answer submitted but incorrect';
      
      // IMPORTANT: For proper API response format, always pass a boolean as the third parameter
      // DO NOT pass an object like { correct: result.isCorrect } as it adds unwanted properties
      // that can break tests expecting a specific response format.
      // See docs/hybrid-response-fix.md for details on this critical issue.
      return createHybridResponse(
        result,                // Data object with all result properties
        message,               // Message based on answer correctness
        result.isCorrect       // IMPORTANT: This must be a boolean value, not an object
      );
    } catch (error) {
      this.logger.error(`[AssessmentController] submitAnswer error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('session/:id/next')
  @UseGuards(JwtAuthGuard, AssessmentOwnerGuard)
  @ApiOperation({ summary: 'Get the next question for an assessment session' })
  @ApiParam({ name: 'id', description: 'Assessment session ID', type: 'string', format: 'uuid' })
  @ApiResponse({ 
    status: 200, 
    description: 'Next question retrieved.',
    type: ResponseWrapper<GetNextQuestionResponseDto>
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (User does not own the session).' })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  async getNextQuestion(
    @Param('id', new ParseUUIDPipe()) sessionId: string,
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

  @Get('session/:id/result')
  @UseGuards(JwtAuthGuard, AssessmentOwnerGuard)
  @ApiOperation({ summary: 'Get the result of a completed assessment session' })
  @ApiParam({ name: 'id', description: 'Assessment session ID', type: 'string', format: 'uuid' })
  @ApiResponse({ 
    status: 200, 
    description: 'Assessment result retrieved.',
    type: ResponseWrapper<SkillScoreDto>
  })
  @ApiResponse({ status: 400, description: 'Bad request (e.g., assessment not completed).' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (User does not own the session).' })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  async getSessionResult(
    @Param('id', new ParseUUIDPipe()) sessionId: string,
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