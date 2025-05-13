import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Enhanced error logging interceptor that logs detailed information about requests and errors
 * and enriches the error response with additional context
 */
@Injectable()
export class ErrorLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('ErrorLoggingInterceptor');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body, params, query } = request;
    const userId = (request.user as any)?.id || 'anonymous';
    const startTime = Date.now();

    // Log the incoming request
    this.logger.log(
      `[${userId}] ${method} ${url} - Start - Params: ${JSON.stringify(params)} Query: ${JSON.stringify(query)} Body: ${
        method !== 'GET' ? JSON.stringify(body) : 'n/a'
      }`
    );

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        this.logger.log(`[${userId}] ${method} ${url} - Complete - Duration: ${duration}ms`);
      }),
      catchError((error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Create enhanced error log with detailed information
        this.logger.error(
          `[${userId}] ${method} ${url} - Error - Duration: ${duration}ms - ${error.message}`,
          error.stack,
          {
            userId,
            method,
            url,
            params,
            query,
            body: method !== 'GET' ? body : undefined,
            statusCode: error.status || error.statusCode || 500,
            errorName: error.name,
            errorType: error instanceof HttpException ? 'HttpException' : 'UnhandledException',
          }
        );

        // Track error metrics here if needed

        // Rethrow the original error
        return throwError(() => error);
      })
    );
  }
} 