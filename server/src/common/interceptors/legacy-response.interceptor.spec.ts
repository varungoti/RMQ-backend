import { Test, TestingModule } from '@nestjs/testing';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { ResponseWrapper } from '../wrappers/response.wrapper';
import { LegacyResponseInterceptor } from './legacy-response.interceptor';

describe('LegacyResponseInterceptor', () => {
  let interceptor: LegacyResponseInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LegacyResponseInterceptor],
    }).compile();

    interceptor = module.get<LegacyResponseInterceptor>(LegacyResponseInterceptor);
    mockExecutionContext = {} as ExecutionContext;
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should pass through non-wrapped responses unchanged', (done) => {
    // Direct DTO object (not wrapped)
    const directResponse = {
      id: '123',
      userResponse: 'A',
      isCorrect: true,
      answeredAt: new Date(),
    };

    mockCallHandler = {
      handle: () => of(directResponse),
    } as CallHandler;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toBe(directResponse);
        done();
      },
    });
  });

  it('should create a hybrid response for wrapped responses', (done) => {
    // Create a sample DTO
    const originalData = {
      id: '123',
      userResponse: 'A',
      isCorrect: true,
      answeredAt: new Date(),
    };

    // Create a wrapped response
    const wrappedResponse = ResponseWrapper.success(originalData, 'Success message');

    mockCallHandler = {
      handle: () => of(wrappedResponse),
    } as CallHandler;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        // Should contain originalData properties
        expect(result.id).toBe(originalData.id);
        expect(result.userResponse).toBe(originalData.userResponse);
        expect(result.isCorrect).toBe(originalData.isCorrect);
        expect(result.answeredAt).toBe(originalData.answeredAt);

        // Should also contain ResponseWrapper properties
        expect(result.success).toBe(true);
        expect(result.data).toBe(originalData);
        expect(result.message).toBe('Success message');

        done();
      },
    });
  });

  it('should handle null or undefined data in wrapped responses', (done) => {
    // Create a wrapped response with null data
    const wrappedResponse = ResponseWrapper.error('Error message');

    mockCallHandler = {
      handle: () => of(wrappedResponse),
    } as CallHandler;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        // Should return original response
        expect(result).toBe(wrappedResponse);
        expect(result.success).toBe(false);
        expect(result.data).toBeNull();
        expect(result.message).toBe('Error message');

        done();
      },
    });
  });

  it('should handle primitive data in wrapped responses', (done) => {
    // Create a wrapped response with primitive data
    const primitiveData = 42;
    const wrappedResponse = ResponseWrapper.success(primitiveData, 'Success with primitive');

    mockCallHandler = {
      handle: () => of(wrappedResponse),
    } as CallHandler;

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        // Should contain ResponseWrapper properties
        expect(result.success).toBe(true);
        expect(result.data).toBe(primitiveData);
        expect(result.message).toBe('Success with primitive');

        // But should not try to spread primitive data at top level
        expect(Object.keys(result).indexOf('0')).toBe(-1);
        expect(Object.keys(result).indexOf('1')).toBe(-1);

        done();
      },
    });
  });
}); 