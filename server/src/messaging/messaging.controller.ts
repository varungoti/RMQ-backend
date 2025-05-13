import { Controller, Logger, ValidationPipe } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AssessmentService } from '../assessment.service';
import { SubmitAnswerDto } from '../dto/submit-answer.dto';
import { ProcessAssessmentResponseDto } from './dto/process-assessment-response.dto';
import { FinishAssessmentSessionDto } from './dto/finish-assessment-session.dto';
import { AssessmentMessageResponseDto, AssessmentSessionResultDto } from './dto/assessment-message-response.dto';

@ApiTags('Messaging')
@Controller()
export class MessagingController {
  private readonly logger = new Logger(MessagingController.name);

  constructor(private readonly assessmentService: AssessmentService) {}

  /**
   * Processes an assessment response received via RabbitMQ.
   * Handles the submission of answers and calculates scores.
   */
  @MessagePattern('process_assessment_response')
  @ApiOperation({
    summary: 'Process assessment response via RabbitMQ',
    description: 'Handles the asynchronous processing of assessment responses.'
  })
  @ApiResponse({
    status: 200,
    description: 'Assessment response processed successfully',
    type: AssessmentMessageResponseDto
  })
  async processAssessmentResponse(
    @Payload(new ValidationPipe()) data: ProcessAssessmentResponseDto,
    @Ctx() context: RmqContext,
  ): Promise<AssessmentMessageResponseDto> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    this.logger.log(`Processing assessment response: ${JSON.stringify(data)}`);

    try {
      const submitAnswerDto: SubmitAnswerDto = {
        assessmentSessionId: data.assessmentSessionId,
        questionId: data.questionId,
        userResponse: data.userResponse,
      };

      const result = await this.assessmentService.submitAnswer(
        data.userId,
        submitAnswerDto,
      );

      // For successful processing, acknowledge the message
      channel.ack(originalMsg);

      return {
        success: true,
        message: 'Assessment response processed successfully',
        ...result
      };
    } catch (error) {
      this.logger.error(`Error processing assessment response: ${error.message}`, error.stack);
      
      // For validation errors or known business errors, acknowledge to prevent retries
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
      
      // For transient errors, reject the message to trigger retry
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

  /**
   * Finishes an assessment session and calculates final scores.
   * This is a terminal operation that marks the session as complete.
   */
  @MessagePattern('finish_assessment_session')
  @ApiOperation({
    summary: 'Finish assessment session via RabbitMQ',
    description: 'Handles the asynchronous completion of assessment sessions.'
  })
  @ApiResponse({
    status: 200,
    description: 'Assessment session finished successfully',
    type: AssessmentSessionResultDto
  })
  async finishAssessmentSession(
    @Payload(new ValidationPipe()) data: FinishAssessmentSessionDto,
    @Ctx() context: RmqContext,
  ): Promise<AssessmentSessionResultDto | AssessmentMessageResponseDto> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    this.logger.log(`Finishing assessment session: ${JSON.stringify(data)}`);

    try {
      const result = await this.assessmentService.calculateOverallScore(
        data.assessmentSessionId
      );

      // For successful completion, acknowledge the message
      channel.ack(originalMsg);

      return {
        success: true,
        assessmentSessionId: data.assessmentSessionId,
        score: result.score,
        level: result.level
      };
    } catch (error) {
      this.logger.error(`Error finishing assessment session: ${error.message}`, error.stack);
      
      // For validation errors or known business errors, acknowledge to prevent retries
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
      
      // For transient errors, reject the message to trigger retry
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
} 