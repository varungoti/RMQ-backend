# API Documentation Review: AuthController

## Overview

The AuthController manages user authentication, including login, registration, and token refresh operations. This review examines the current Swagger/OpenAPI documentation and provides recommendations for improvement, especially focusing on standardizing the hybrid response format.

## Current State Analysis

### Strengths

1. **Controller setup**:
   - `@ApiTags('Authentication')` provides clear categorization in Swagger UI
   - Method-level JSDoc comments provide good context about endpoints

2. **Login endpoint**:
   - `@ApiOperation` provides a clear summary
   - `@ApiBody` describes the request body structure with examples
   - `@ApiResponse` documents different response status codes

3. **Register endpoint**:
   - Good descriptions for validation error responses
   - Uses the User entity for response type

4. **Refresh endpoint**:
   - Simple and clear schema definition for response

### Areas for Improvement

1. **Missing hybrid response documentation**:
   - AuthController doesn't use `LegacyResponseInterceptor` or document hybrid responses
   - Login, register, and refresh don't show hybrid response formats

2. **Incomplete response examples**:
   - No detailed response examples provided (only types)
   - No content examples in ApiResponse for more detailed visualization

3. **Missing API documentation decorators**:
   - No `@ApiExtraModels()` at the controller level
   - No `@ApiBearerAuth()` for the refresh token endpoint

4. **Potential inconsistency with other controllers**:
   - Different response format approach than AssessmentController
   - Does not use ResponseWrapper consistently

## Recommendations

### 1. Add Controller-Level Decorators

```typescript
@ApiTags('Authentication')
@Controller('auth')
@ApiExtraModels(LoginResponseDto, User, RefreshTokenDto, ResponseWrapper)
export class AuthController {
  // ...
}
```

### 2. Update the Login Endpoint Documentation

```typescript
@UseGuards(LocalAuthGuard)
@Post('login')
@HttpCode(HttpStatus.OK)
@ApiOperation({ 
  summary: 'Logs a user in',
  description: 'Authenticates a user with email and password, returns JWT access and refresh tokens upon success'
})
@ApiBody({ 
  description: 'User credentials for login',
  schema: { 
    properties: { 
      email: { type: 'string', example: 'user@example.com' }, 
      password: { type: 'string', format: 'password', example: 'password123' } 
    },
    required: ['email', 'password']
  }
})
@ApiResponse({ 
  status: 200, 
  description: 'Login successful, returns access and refresh tokens.',
  schema: {
    allOf: [
      { $ref: getSchemaPath(ResponseWrapper) },
      {
        properties: {
          data: { $ref: getSchemaPath(LoginResponseDto) },
          // Direct properties
          access_token: { type: 'string' },
          refresh_token: { type: 'string' }
        }
      }
    ]
  },
  content: {
    'application/json': {
      example: {
        success: true,
        message: 'Login successful',
        data: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  }
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized - Invalid credentials.',
  content: {
    'application/json': {
      example: {
        success: false,
        message: 'Invalid credentials',
        statusCode: 401
      }
    }
  }
})
```

### 3. Update the Register Endpoint Documentation

```typescript
@Post('register')
@HttpCode(HttpStatus.CREATED)
@ApiOperation({ 
  summary: 'Registers a new user',
  description: 'Creates a new user account with email and password. Returns the created user object (without password hash).'
})
@ApiBody({ type: CreateUserDto })
@ApiResponse({ 
  status: 201, 
  description: 'User registered successfully. Response excludes password hash.',
  schema: {
    allOf: [
      { $ref: getSchemaPath(ResponseWrapper) },
      {
        properties: {
          data: { $ref: getSchemaPath(User) },
          // Direct properties (minus passwordHash)
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['USER', 'ADMIN', 'TEACHER'] },
          gradeLevel: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    ]
  },
  content: {
    'application/json': {
      example: {
        success: true,
        message: 'User registered successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test.user@example.com',
          role: 'USER',
          gradeLevel: 5,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        },
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test.user@example.com',
        role: 'USER',
        gradeLevel: 5,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }
    }
  }
}) 
@ApiResponse({ 
  status: 409, 
  description: 'Conflict - Email already exists.',
  content: {
    'application/json': {
      example: {
        success: false,
        message: 'User with this email already exists',
        statusCode: 409
      }
    }
  }
})
@ApiResponse({ 
  status: 400, 
  description: 'Bad Request - Validation failed (e.g., invalid email, weak password, missing fields).',
  content: {
    'application/json': {
      example: {
        success: false,
        message: 'Validation failed',
        statusCode: 400,
        errors: [
          'email must be a valid email address',
          'password must be at least 8 characters long'
        ]
      }
    }
  }
})
```

### 4. Update the Refresh Token Endpoint Documentation

```typescript
@UseGuards(RefreshJwtAuthGuard)
@Post('refresh')
@HttpCode(HttpStatus.OK)
@ApiBearerAuth()
@ApiOperation({ 
  summary: 'Refresh access token',
  description: 'Issues a new access token using a valid refresh token. Requires a valid refresh token in the Authorization header.'
})
@ApiResponse({
  status: 200, 
  description: 'Access token refreshed successfully.',
  schema: {
    allOf: [
      { $ref: getSchemaPath(ResponseWrapper) },
      {
        properties: {
          data: { 
            type: 'object',
            properties: {
              access_token: { type: 'string' }
            }
          },
          // Direct properties
          access_token: { type: 'string' }
        }
      }
    ]
  },
  content: {
    'application/json': {
      example: {
        success: true,
        message: 'Access token refreshed successfully',
        data: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  }
})
@ApiResponse({ 
  status: 401, 
  description: 'Unauthorized - Invalid Refresh Token',
  content: {
    'application/json': {
      example: {
        success: false,
        message: 'Invalid refresh token',
        statusCode: 401
      }
    }
  }
})
```

### 5. Implement Consistent Response Format

To maintain consistency with other controllers, update the AuthController to use the ResponseWrapper pattern:

```typescript
// Apply the Legacy Response Interceptor
@ApiTags('Authentication')
@Controller('auth')
@UseInterceptors(LegacyResponseInterceptor)
@ApiExtraModels(LoginResponseDto, User, RefreshTokenDto, ResponseWrapper)
export class AuthController {
  // ...
}

// Update each method to return ResponseWrapper
async login(@Request() req: { user: Omit<User, 'passwordHash'> }): Promise<ResponseWrapper<LoginResponseDto>> {
  this.logger.log(`Login successful for user: ${req.user.email}`);
  const result = await this.authService.login(req.user);
  return ResponseWrapper.success(result, 'Login successful');
}

async register(@Body() createUserDto: CreateUserDto): Promise<ResponseWrapper<Omit<User, "passwordHash">>> {
  this.logger.log(`Registration attempt for email: ${createUserDto.email}`);
  const user = await this.authService.register(createUserDto);
  this.logger.log(`Registration successful for user: ${user?.email}`);
  return ResponseWrapper.success(user, 'User registered successfully');
}

async refreshToken(@Request() req): Promise<ResponseWrapper<{ access_token: string }>> {
  this.logger.log(`Refresh token request received for user sub: ${req.user?.sub}`);
  const result = await this.authService.refreshToken(req.user);
  return ResponseWrapper.success(result, 'Access token refreshed successfully');
}
```

## Summary of Recommended Changes

1. **Add controller-level decorators**:
   - `@ApiExtraModels()` with related DTOs
   - `@UseInterceptors(LegacyResponseInterceptor)` for consistent response handling

2. **Enhance endpoint documentation**:
   - Add `@ApiBearerAuth()` for protected endpoints
   - Add detailed descriptions to ApiOperation decorators
   - Update response schemas to include the hybrid format (allOf)
   - Add content examples for all responses

3. **Standardize implementation approach**:
   - Update all methods to return `ResponseWrapper<T>`
   - Use `ResponseWrapper.success()` pattern consistently

4. **Improve response examples**:
   - Add realistic JWT token examples
   - Include success/error messages in examples
   - Document all properties available in the hybrid response

These changes will ensure the AuthController documentation is consistent with the rest of the API and properly reflects the hybrid response format used throughout the application. 