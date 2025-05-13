/**
 * Utility functions for handling API responses during the format transition
 */

import { ResponseWrapper } from '../wrappers/response.wrapper';
import { HybridResponse } from '../types/hybrid-response.type';
import { isObject } from 'class-validator';

/**
 * Extracts data from a response that could be either wrapped or direct DTO
 * @param response Response object to extract data from
 * @returns The extracted data or the original response if not wrapped
 */
export function extractResponseData<T>(response: T | ResponseWrapper<T>): T {
  if (response && typeof response === 'object' && 'data' in response && 'success' in response) {
    return (response as ResponseWrapper<T>).data;
  }
  return response as T;
}

/**
 * Checks if a response is successful
 * @param response Response to check
 * @param successProp Optional property name to check for success (for backward compatibility)
 * @returns True if the response is successful or not wrapped, false otherwise
 */
export function isResponseSuccessful<T>(
  response: T | ResponseWrapper<T>, 
  successProp?: string
): boolean {
  if (!response) {
    return false;
  }
  
  if (typeof response === 'object' && 'success' in response) {
    return (response as ResponseWrapper<T>).success === true;
  }
  
  if (successProp && typeof response === 'object' && successProp in response) {
    return Boolean((response as any)[successProp]);
  }
  
  // For direct responses, check for isCorrect or isValid properties
  if (typeof response === 'object') {
    if ('isCorrect' in response) {
      return Boolean((response as any).isCorrect);
    }
    if ('isValid' in response) {
      return Boolean((response as any).isValid);
    }
  }
  
  return true; // Default to true for other non-wrapped responses
}

/**
 * Gets the message from a response
 * @param response Response to get message from
 * @param fallbackMessage Optional fallback message if no message is found
 * @returns The message from the response or fallback message if no message found
 */
export function getResponseMessage<T>(
  response: T | ResponseWrapper<T>,
  fallbackMessage: string = 'Operation completed'
): string {
  if (!response) {
    return fallbackMessage;
  }
  
  if (typeof response === 'object' && 'message' in response) {
    return (response as ResponseWrapper<T>).message || fallbackMessage;
  }
  
  return fallbackMessage;
}

/**
 * Interface for hybrid response properties
 */
export interface HybridResponseProps {
  success: boolean;
  message?: string;
  data?: any;
  [key: string]: any;
}

/**
 * Type guard to check if an object is a hybrid response
 * @param obj Object to check
 * @returns True if the object is a hybrid response
 */
export function isHybridResponse(obj: unknown): obj is Record<string, unknown> & HybridResponseProps {
  return obj !== null 
    && typeof obj === 'object' 
    && 'success' in obj 
    && typeof (obj as HybridResponseProps).success === 'boolean';
}

/**
 * Creates a hybrid response that combines both wrapped format and direct DTO properties
 * for backward compatibility during API format transition
 * 
 * @param data The data to include in the response
 * @param message Optional message to include in the response
 * @param successOrProps IMPORTANT: This parameter affects the response structure:
 *                      - If boolean: Sets ONLY the 'success' property without adding other properties
 *                      - If object: Spreads ALL properties from the object into the response, which may cause test failures
 *                      
 * @example
 * // Correct usage (recommended) - passing a boolean for success:
 * createHybridResponse(result, "Operation succeeded", true);
 * // Result will have success=true but NO 'correct' property
 * 
 * @example
 * // Alternative usage (use with caution) - passing an object:
 * createHybridResponse(result, "Operation succeeded", { additionalProp: value });
 * // Result will have additionalProp=value in the response
 * 
 * @example
 * // INCORRECT usage (will cause test failures):
 * createHybridResponse(result, "Operation succeeded", { correct: result.isCorrect });
 * // This adds an unwanted 'correct' property that may break tests expecting a specific format
 * 
 * @returns A hybrid response object combining direct properties and wrapper properties
 */
export function createHybridResponse<T>(
  data: T | null, 
  messageOrSuccess: string | boolean = '', 
  successOrProps: boolean | Record<string, any> = true
): any {
  // Determine the success value and additional properties
  // Handle both string|boolean messageOrSuccess parameter
  let message = '';
  let success = typeof successOrProps === 'boolean' ? successOrProps : true;
  
  // If messageOrSuccess is a boolean, use it as success and empty string as message
  if (typeof messageOrSuccess === 'boolean') {
    success = messageOrSuccess;
  } else {
    // Otherwise use it as message
    message = messageOrSuccess;
  }
  const additionalProps = typeof successOrProps === 'object' ? successOrProps : {};
  
  // Handle null or undefined data
  if (data === null || data === undefined) {
    return {
      success,
      message,
      data: null,
      ...additionalProps
    };
  }

  // If data is already a response wrapper, return it
  if (data && typeof data === 'object' && 'success' in data) {
    return data;
  }

  // Ensure data is an object
  if (typeof data !== 'object') {
    return {
      success,
      message,
      data,
      ...additionalProps
    };
  }

  // Create the response by combining the data, wrapper properties, and any additional properties
  const result = {
    ...data as Record<string, any>,
    success,
    message: message || '',
    data,
    ...additionalProps
  };
  
  return result;
} 