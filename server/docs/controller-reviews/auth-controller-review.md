# AuthController Documentation Review

## Current Implementation

The AuthController currently returns direct responses without using the hybrid response format:

```typescript
@Controller('auth')
export class AuthController {
  @Post('login')
  async login(@Request() req): Promise<LoginResponseDto> {
    return this.authService.login(req.user);
  }
}
```

### Areas for Improvement

1. Not using `LegacyResponseInterceptor`
2. Direct DTO responses without wrapping
3. Swagger documentation doesn't reflect future response format
4. Inconsistent with other controllers' response format

### Current Response Format

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Recommended Response Format

```json
{
  // Direct properties (legacy format)
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  
  // Wrapped properties (new format)
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

## Recommended Changes

1. Add `LegacyResponseInterceptor`:
```typescript
@UseInterceptors(LegacyResponseInterceptor)
@Controller('auth')
export class AuthController {
  // ...
}
```

2. Update return types to use `ResponseWrapper`:
```typescript
@Post('login')
async login(@Request() req): Promise<ResponseWrapper<LoginResponseDto>> {
  const result = await this.authService.login(req.user);
  return createHybridResponse(
    result,
    'Login successful'
  );
}
```

3. Update Swagger documentation:
```typescript
@ApiExtraModels(ResponseWrapper, LoginResponseDto)
@ApiResponse({
  status: 200,
  description: 'Login successful.',
  schema: {
    allOf: [
      { $ref: getSchemaPath(ResponseWrapper) },
      {
        properties: {
          data: { $ref: getSchemaPath(LoginResponseDto) }
        }
      }
    ]
  }
})
```

4. Add response examples:
```typescript
@ApiResponse({
  content: {
    'application/json': {
      examples: {
        legacy: {
          summary: 'Legacy Format',
          value: {
            access_token: "eyJhbGciOiJIUzI1NiIs...",
            refresh_token: "eyJhbGciOiJIUzI1NiIs..."
          }
        },
        wrapped: {
          summary: 'Wrapped Format',
          value: {
            success: true,
            message: "Login successful",
            data: {
              access_token: "eyJhbGciOiJIUzI1NiIs...",
              refresh_token: "eyJhbGciOiJIUzI1NiIs..."
            }
          }
        }
      }
    }
  }
})
```

## Test Updates Needed

1. Update E2E tests to expect hybrid format
2. Add tests for response structure
3. Verify both formats are present
4. Check success/message properties

## Migration Steps

1. Add `LegacyResponseInterceptor`
2. Update return types
3. Modify service methods
4. Update tests
5. Update Swagger docs
6. Add deprecation notices 