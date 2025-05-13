import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { isObject } from 'class-validator';
import { createHybridResponse, isHybridResponse } from '../utils/response-helper';

/**
 * Interceptor that automatically converts wrapped responses to a hybrid format
 * that ensures backward compatibility with direct DTO formats.
 * 
 * This interceptor allows controllers to return ResponseWrapper objects
 * while still making them compatible with clients expecting direct DTOs.
 */
@Injectable()
export class LegacyResponseInterceptor implements NestInterceptor {
  /**
   * Intercepts the response and transforms it into a hybrid format if needed
   * @param context The execution context
   * @param next The next handler in the chain
   * @returns An observable with the transformed response
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(response => {
        // Skip null/undefined responses
        if (response === null || response === undefined) {
          return response;
        }

        // Skip if already in hybrid format
        if (isHybridResponse(response)) {
          return response;
        }

        // Convert wrapped responses to hybrid format
        if (this.isWrappedResponse(response)) {
          const { success, data, message } = response;
          return createHybridResponse(data, message, success);
        }

        // For unwrapped responses, keep as is
        return response;
      })
    );
  }

  /**
   * Checks if a response is in the wrapped format
   * @param response The response to check
   * @returns True if the response is in the wrapped format
   */
  private isWrappedResponse(response: any): boolean {
    if (!isObject(response)) {
      return false;
    }
    
    return (
      'success' in response && 
      'data' in response && 
      'message' in response &&
      typeof response.success === 'boolean'
    );
  }
} 