import { ResponseWrapper } from '../wrappers/response.wrapper';

/**
 * Types for API response formats
 */

/**
 * Basic API response format with standard properties
 */
export interface ApiResponse<T> {
  /**
   * Indicates if the operation was successful
   */
  success: boolean;
  
  /**
   * The data returned by the operation
   */
  data: T;
  
  /**
   * Additional information about the operation
   */
  message: string;
}

/**
 * Type for hybrid responses that combine both wrapped format and direct DTO properties
 */
export type HybridResponse<T> = T & {
  success: boolean;
  message?: string;
  data: T;
  [key: string]: any;
};

/**
 * Type guard to check if a response is in the hybrid format
 */
export function isHybridResponse<T extends Record<string, any>>(response: any): response is HybridResponse<T> {
  if (typeof response !== 'object' || response === null) {
    return false;
  }
  
  // Must have success and data properties
  if (!('success' in response && 'data' in response)) {
    return false;
  }
  
  // Must have data properties at root level
  const dataProperties = Object.keys(response.data || {});
  return dataProperties.some(key => key in response && key !== 'success' && key !== 'data' && key !== 'message');
} 