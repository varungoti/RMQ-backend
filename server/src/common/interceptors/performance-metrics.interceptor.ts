import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Interceptor that tracks and logs performance metrics for API requests
 * This can be extended to send metrics to monitoring systems
 */
@Injectable()
export class PerformanceMetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger('PerformanceMetrics');
  
  // Define performance thresholds in milliseconds
  private readonly WARN_THRESHOLD = 1000; // 1 second
  private readonly ERROR_THRESHOLD = 3000; // 3 seconds

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const startTime = Date.now();
    
    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Log with appropriate level based on duration
        if (duration > this.ERROR_THRESHOLD) {
          this.logger.error(`SLOW REQUEST [${method}] ${url} - ${duration}ms`);
        } else if (duration > this.WARN_THRESHOLD) {
          this.logger.warn(`SLOW REQUEST [${method}] ${url} - ${duration}ms`);
        } else {
          this.logger.log(`REQUEST [${method}] ${url} - ${duration}ms`);
        }
        
        // Store metrics data for monitoring
        // This could be sent to a time-series database or monitoring service
        const metricsData = {
          timestamp: new Date().toISOString(),
          method,
          url,
          duration,
          endpoint: this.normalizeEndpoint(url),
        };
        
        // We could send this data to a metrics service
        // metricsService.recordApiMetric(metricsData);
      })
    );
  }
  
  /**
   * Normalizes URL paths to group similar endpoints together in metrics
   * e.g., /assessment/123/next and /assessment/456/next become /assessment/:id/next
   */
  private normalizeEndpoint(url: string): string {
    // Replace UUIDs and numeric IDs with placeholders
    return url.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
              .replace(/\/[0-9]+/g, '/:id');
  }
} 