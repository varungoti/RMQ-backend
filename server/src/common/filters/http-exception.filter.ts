import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseWrapper } from '../wrappers/response.wrapper';

/**
 * Global HTTP exception filter that provides consistent error responses
 * across the application.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse();

    // Extract the error message
    let errorMessage = 'Internal server error';
    if (typeof errorResponse === 'string') {
      errorMessage = errorResponse;
    } else if (typeof errorResponse === 'object' && errorResponse !== null) {
      if ('message' in errorResponse) {
        const message = errorResponse['message'];
        if (Array.isArray(message)) {
          // For validation errors that return an array of messages
          errorMessage = message.join(', ');
        } else if (typeof message === 'string') {
          errorMessage = message;
        }
      }
    }

    // Log the error (with different log levels based on status)
    const logMethod = status >= HttpStatus.INTERNAL_SERVER_ERROR
      ? this.logger.error.bind(this.logger)
      : status >= HttpStatus.BAD_REQUEST
        ? this.logger.warn.bind(this.logger)
        : this.logger.log.bind(this.logger);

    logMethod(
      `[${request.method}] ${request.url} - ${status} ${errorMessage}`,
      exception.stack,
    );

    // Return a consistent error response
    response.status(status).json(ResponseWrapper.error(errorMessage));
  }
} 