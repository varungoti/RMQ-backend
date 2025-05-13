import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare class PerformanceMetricsInterceptor implements NestInterceptor {
    private readonly logger;
    private readonly WARN_THRESHOLD;
    private readonly ERROR_THRESHOLD;
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private normalizeEndpoint;
}
