# API Documentation Review: RecommendationsController

## Overview

The RecommendationsController manages personalized learning recommendations and recommendation resources. It provides endpoints for retrieving personalized recommendations, managing recommendation resources, and handling AI-generated recommendations. The controller implements role-based access control and supports both student self-service and administrative/teacher oversight.

## Current State Analysis

### Strengths

1. **Controller setup**:
   - `@ApiTags('Recommendations')` clearly indicates functionality
   - `@ApiBearerAuth()` correctly applied for authentication
   - Role-based access control implemented with `@UseGuards(JwtAuthGuard, RolesGuard)`

2. **Endpoint documentation**:
   - All endpoints have `@ApiOperation` with clear summaries
   - `@ApiQuery` parameters well documented with types and descriptions
   - `@ApiResponse` for relevant status codes

3. **Type Information**:
   - Strong typing with comprehensive DTOs
   - Proper enum usage for recommendation types
   - Clear validation rules

### Areas for Improvement

1. **Missing hybrid response documentation**:
   - No `LegacyResponseInterceptor` used
   - Return types don't use ResponseWrapper
   - Response schemas don't document the hybrid format

2. **Incomplete response examples**:
   - No content examples for API responses
   - Only type references used in ApiResponse decorators
   - Missing detailed examples of success/error responses

3. **Missing API documentation decorators**:
   - No `@ApiExtraModels()` at controller level
   - No detailed response schema structure using allOf pattern

## Recommendations

### 1. Add Controller-Level Decorators

```typescript
@ApiTags('Recommendations')
@ApiBearerAuth()
@Controller('recommendations')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(LegacyResponseInterceptor)
@ApiExtraModels(
  RecommendationDto,
  RecommendationSetDto,
  RecommendationResourceDto,
  RecommendationQueryDto,
  ResponseWrapper
)
export class RecommendationsController {
  // ...
}
```

### 2. Update the GetRecommendations Endpoint Documentation

```typescript
@Get()
@ApiOperation({ 
  summary: 'Get personalized recommendations',
  description: 'Retrieves personalized recommendations for the authenticated user or a specified user (for admins/teachers).'
})
@ApiQuery({ 
  name: 'userId', 
  required: false, 
  description: 'Target User ID (Admin/Teacher only)', 
  type: String, 
  format: 'uuid' 
})
@ApiQuery({ 
  name: 'limit', 
  required: false, 
  description: 'Max number of recommendations', 
  type: Number, 
  example: 5 
})
@ApiQuery({ 
  name: 'type', 
  required: false, 
  description: 'Filter by recommendation type', 
  enum: RecommendationType 
})
@ApiQuery({ 
  name: 'skillId', 
  required: false, 
  description: 'Filter by specific skill ID', 
  type: String, 
  format: 'uuid' 
})
@ApiResponse({ 
  status: 200, 
  description: 'Returns personalized recommendations',
  schema: {
    allOf: [
      { $ref: getSchemaPath(ResponseWrapper) },
      {
        properties: {
          data: { $ref: getSchemaPath(RecommendationSetDto) },
          // Direct properties for hybrid format
          recommendations: {
            type: 'array',
            items: { $ref: getSchemaPath(RecommendationDto) }
          },
          length: { type: 'number' }
        }
      }
    ]
  },
  content: {
    'application/json': {
      example: {
        success: true,
        message: 'Recommendations retrieved successfully',
        data: {
          recommendations: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              skillId: '123e4567-e89b-12d3-a456-426614174001',
              skillName: 'Basic Algebra',
              priority: 'HIGH',
              score: 65,
              targetScore: 80,
              explanation: 'Focus on improving algebraic expressions',
              aiGenerated: true,
              resources: [
                {
                  id: '123e4567-e89b-12d3-a456-426614174002',
                  title: 'Algebra Basics',
                  description: 'Introduction to algebraic concepts',
                  url: 'https://example.com/algebra-basics',
                  type: 'lesson',
                  estimatedTimeMinutes: 30,
                  tags: ['algebra', 'basics']
                }
              ]
            }
          ]
        },
        // Hybrid format direct access
        recommendations: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            skillId: '123e4567-e89b-12d3-a456-426614174001',
            skillName: 'Basic Algebra',
            priority: 'HIGH',
            score: 65,
            targetScore: 80,
            explanation: 'Focus on improving algebraic expressions',
            aiGenerated: true,
            resources: [
              {
                id: '123e4567-e89b-12d3-a456-426614174002',
                title: 'Algebra Basics',
                description: 'Introduction to algebraic concepts',
                url: 'https://example.com/algebra-basics',
                type: 'lesson',
                estimatedTimeMinutes: 30,
                tags: ['algebra', 'basics']
              }
            ]
          }
        ],
        length: 1
      }
    }
  }
})
@ApiResponse({ 
  status: 401, 
  description: 'Unauthorized - Missing or invalid JWT token',
  content: {
    'application/json': {
      example: {
        statusCode: 401,
        message: 'Unauthorized'
      }
    }
  }
})
@ApiResponse({ 
  status: 403, 
  description: 'Forbidden - Cannot access other user\'s recommendations',
  content: {
    'application/json': {
      example: {
        success: false,
        message: 'Only administrators or teachers can access other users\' recommendations',
        statusCode: 403
      }
    }
  }
})
```

### 3. Update the GetRecommendationResources Endpoint Documentation

```typescript
@Get('resources')
@ApiOperation({ 
  summary: 'Get available recommendation resources',
  description: 'Retrieves available recommendation resources that can be used for learning. Supports filtering by type, grade level, and skill.'
})
@ApiQuery({ 
  name: 'skillId', 
  required: false, 
  description: 'Filter by associated skill ID (Not currently implemented in service)', 
  type: String, 
  format: 'uuid' 
})
@ApiQuery({ 
  name: 'type', 
  required: false, 
  description: 'Filter by resource type', 
  enum: RecommendationType 
})
@ApiQuery({ 
  name: 'gradeLevel', 
  required: false, 
  description: 'Filter by grade level', 
  type: Number 
})
@ApiResponse({ 
  status: 200, 
  description: 'Returns available recommendation resources',
  schema: {
    allOf: [
      { $ref: getSchemaPath(ResponseWrapper) },
      {
        properties: {
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(RecommendationResourceDto) }
          },
          // Direct properties for hybrid format
          resources: {
            type: 'array',
            items: { $ref: getSchemaPath(RecommendationResourceDto) }
          },
          length: { type: 'number' }
        }
      }
    ]
  },
  content: {
    'application/json': {
      example: {
        success: true,
        message: 'Recommendation resources retrieved successfully',
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: 'Algebra Basics',
            description: 'Introduction to algebraic concepts',
            url: 'https://example.com/algebra-basics',
            type: 'lesson',
            estimatedTimeMinutes: 30,
            tags: ['algebra', 'basics']
          }
        ],
        // Hybrid format direct access
        0: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Algebra Basics',
          description: 'Introduction to algebraic concepts',
          url: 'https://example.com/algebra-basics',
          type: 'lesson',
          estimatedTimeMinutes: 30,
          tags: ['algebra', 'basics']
        },
        length: 1
      }
    }
  }
})
@ApiResponse({ 
  status: 401, 
  description: 'Unauthorized - Missing or invalid JWT token',
  content: {
    'application/json': {
      example: {
        statusCode: 401,
        message: 'Unauthorized'
      }
    }
  }
})
```

### 4. Implement Consistent Response Format

Update controller methods to use the ResponseWrapper pattern:

```typescript
@Get()
async getRecommendations(
  @Req() req: any,
  @Query() queryParams: RecommendationQueryDto,
): Promise<ResponseWrapper<RecommendationSetDto>> {
  this.logger.log(`User ${req.user.userId} requesting recommendations with query: ${JSON.stringify(queryParams)}`);
  
  if (queryParams.userId && queryParams.userId !== req.user.userId) {
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.TEACHER) {
      throw new ForbiddenException('Only administrators or teachers can access other users\' recommendations');
    }
  }
  
  const userId = queryParams.userId || req.user.userId;
  const recommendations = await this.recommendationsService.getRecommendations(userId, queryParams);
  return ResponseWrapper.success(recommendations, 'Recommendations retrieved successfully');
}

@Get('resources')
async getRecommendationResources(
  @Query('skillId') skillId?: string,
  @Query('type') type?: RecommendationType,
  @Query('gradeLevel') gradeLevel?: number,
): Promise<ResponseWrapper<RecommendationResourceDto[]>> {
  this.logger.log(`Fetching recommendation resources (skillId: ${skillId}, type: ${type}, gradeLevel: ${gradeLevel})`);
  const resources = await this.recommendationsService.getRecommendationResources(type, gradeLevel);
  return ResponseWrapper.success(resources, 'Recommendation resources retrieved successfully');
}
```

## Special Considerations

### 1. AI-Generated Content

The recommendations system includes AI-generated content, which requires special documentation:

1. **AI Flag**: Document the `aiGenerated` field in responses
2. **LLM Integration**: Document LLM-related endpoints and configuration
3. **Cache Management**: Document cache control endpoints for AI-generated content

### 2. Role-Based Access

The controller implements role-based access with special privileges for admins and teachers:

1. **Documentation**: Clearly indicate which roles can access what functionality
2. **Examples**: Provide examples for both student and admin/teacher scenarios
3. **Error Responses**: Document role-specific error cases

### 3. Resource Types

The system supports multiple types of learning resources:

1. **Enum Documentation**: Document all available RecommendationType values
2. **Filtering**: Document how type filtering affects recommendations
3. **Examples**: Provide examples for each resource type

## Summary of Recommended Changes

1. **Add controller-level decorators**:
   - `@UseInterceptors(LegacyResponseInterceptor)`
   - `@ApiExtraModels()` with all related DTOs

2. **Enhance endpoint documentation**:
   - Add detailed descriptions
   - Update response schemas for hybrid format
   - Add content examples
   - Document AI-specific features

3. **Standardize implementation**:
   - Update methods to return `ResponseWrapper<T>`
   - Use `ResponseWrapper.success()` pattern
   - Implement consistent error handling

4. **Improve error documentation**:
   - Document all possible error responses
   - Include role-specific error cases
   - Provide detailed error examples

These changes will align the RecommendationsController with the rest of the API while properly documenting its unique features related to AI-generated content and role-based access control. 