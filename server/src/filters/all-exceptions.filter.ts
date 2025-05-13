import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error(
      `[${request.method} ${request.url}] Exception caught in AllExceptionsFilter: ${exception instanceof Error ? exception.message : JSON.stringify(exception)}`,
      exception instanceof Error ? exception.stack : undefined,
    );
    if (exception instanceof HttpException) {
      this.logger.error(`HttpException Response: ${JSON.stringify(exception.getResponse())}`);
    }

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      message: exception instanceof HttpException ? exception.message : 'Internal server error',
      ...(process.env.NODE_ENV !== 'production' && !(exception instanceof HttpException) && { error: String(exception) }),
    };

    httpAdapter.reply(response, responseBody, httpStatus);
  }
} 