/**
 * Helper utilities for client applications to handle API responses during the transition
 * from direct DTOs to the ResponseWrapper format.
 * 
 * This file can be copied to client applications or served as a reference.
 */

/**
 * Determines if a response is in the wrapped format (with success, data, message properties)
 * 
 * @param response The API response to check
 * @returns True if the response is in the wrapped format
 */
export function isWrappedResponse(response: any): boolean {
  return Boolean(
    response && 
    typeof response === 'object' && 
    'success' in response && 
    'data' in response
  );
}

/**
 * Extracts the data from an API response, regardless of whether it's in
 * the original direct format or the new ResponseWrapper format.
 * 
 * @param response The API response to extract data from
 * @returns The extracted data
 */
export function extractData<T>(response: any): T {
  return isWrappedResponse(response) ? response.data : response;
}

/**
 * Checks if an API response indicates success, working with both
 * the original direct format and the new ResponseWrapper format.
 * 
 * @param response The API response to check
 * @param legacySuccessProperty For direct responses, the property to check for success (default: 'isCorrect')
 * @returns True if the response indicates success
 */
export function isSuccessful(response: any, legacySuccessProperty = 'isCorrect'): boolean {
  if (!response) {
    return false;
  }

  if (isWrappedResponse(response)) {
    return response.success === true;
  }
  
  return typeof response === 'object' && response[legacySuccessProperty] === true;
}

/**
 * Gets the message from an API response, working with both
 * the original direct format and the new ResponseWrapper format.
 * 
 * @param response The API response to extract the message from
 * @param fallbackMessage A fallback message if no message is found
 * @returns The response message or fallback
 */
export function getMessage(response: any, fallbackMessage = 'Operation completed'): string {
  if (
    response && 
    typeof response === 'object' && 
    'message' in response &&
    typeof response.message === 'string'
  ) {
    return response.message;
  }
  
  return fallbackMessage;
}

/**
 * Comprehensive helper that processes an API response and provides a standardized result
 * regardless of which format the response is in.
 * 
 * @param response The API response to process
 * @param options Options for processing
 * @returns A standardized response object
 */
export function processResponse<T>(
  response: any, 
  options: {
    legacySuccessProperty?: string;
    fallbackMessage?: string;
    onSuccess?: (data: T) => void;
    onError?: (message: string) => void;
  } = {}
): {
  data: T;
  success: boolean;
  message: string;
  isWrappedFormat: boolean;
} {
  const {
    legacySuccessProperty = 'isCorrect',
    fallbackMessage = 'Operation completed',
    onSuccess,
    onError
  } = options;

  const isWrappedFormat = isWrappedResponse(response);
  const data = extractData<T>(response);
  const success = isSuccessful(response, legacySuccessProperty);
  const message = getMessage(response, fallbackMessage);

  if (success && onSuccess) {
    onSuccess(data);
  } else if (!success && onError) {
    onError(message);
  }

  return {
    data,
    success,
    message,
    isWrappedFormat
  };
}

/**
 * Example usage:
 * 
 * async function fetchUserProfile(userId: string) {
 *   try {
 *     const response = await fetch(`/api/users/${userId}`);
 *     const data = await response.json();
 *     
 *     return processResponse(data, {
 *       onSuccess: (userData) => {
 *         // Update UI with user data
 *         updateUserInterface(userData);
 *       },
 *       onError: (errorMessage) => {
 *         // Show error to user
 *         showErrorNotification(errorMessage);
 *       }
 *     });
 *   } catch (error) {
 *     console.error('API request failed', error);
 *     return {
 *       data: null,
 *       success: false,
 *       message: 'Failed to fetch user data',
 *       isWrappedFormat: false
 *     };
 *   }
 * }
 */ 