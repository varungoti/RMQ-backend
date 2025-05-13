import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard API response wrapper to ensure consistent response format
 * across the application.
 * 
 * @template T The type of data being returned
 */
export class ResponseWrapper<T> {
  /**
   * Indicates if the request was successful
   */
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  success: boolean;

  /**
   * The data returned by the operation
   */
  @ApiProperty({
    description: 'The data returned by the operation',
    example: {},
  })
  data: T;

  /**
   * Optional message providing additional information
   */
  @ApiProperty({
    description: 'Additional information about the operation',
    example: 'Operation completed successfully',
    required: false,
  })
  message?: string;

  /**
   * Creates a success response
   * 
   * @param data The data to return
   * @param message Optional message
   * @returns ResponseWrapper with success=true
   */
  static success<T>(data: T, message?: string): ResponseWrapper<T> {
    const response = new ResponseWrapper<T>();
    response.success = true;
    response.data = data;
    if (message) {
      response.message = message;
    }
    return response;
  }

  /**
   * Creates an error response
   * 
   * @param message Error message
   * @returns ResponseWrapper with success=false and null data
   */
  static error<T>(message: string): ResponseWrapper<T> {
    const response = new ResponseWrapper<T>();
    response.success = false;
    response.data = null;
    response.message = message;
    return response;
  }
} 