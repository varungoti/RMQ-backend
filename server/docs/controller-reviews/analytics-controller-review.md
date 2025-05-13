# AnalyticsController Documentation Review

## Current Implementation

The AnalyticsController handles analytics and performance data with role-based access control but currently returns direct DTO responses without using the hybrid response format:

```typescript
@Controller('analytics')
export class AnalyticsController {
  @Get('user-performance')
  async getUserPerformance(
    @Request() req: AuthenticatedRequest,
    @Query() queryParams: UserPerformanceQueryDto,
  ): Promise<UserPerformanceDto> {
    // ...
  }
}
```

### Areas for Improvement

1. Not using `LegacyResponseInterceptor`
2. Direct DTO responses without wrapping
3. Swagger documentation doesn't reflect future response format
4. Complex response types need clear documentation
5. Role-based access needs clearer documentation
6. Array responses need standardization

### Current Response Formats

1. **User Performance Response**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "username": "student1",
  "email": "student1@example.com",
  "gradeLevel": 10,
  "overallScore": 85.5,
  "assessmentCount": 10,
  "skillPerformance": [
    {
      "skillId": "skill123",
      "skillName": "JavaScript",
      "score": 90,
      "questionsAttempted": 20,
      "correctAnswers": 18,
      "incorrectAnswers": 2,
      "lastAttemptDate": "2024-04-15T10:30:00Z"
    }
  ],
  "recentAssessments": [
    {
      "id": "assessment123",
      "startedAt": "2024-04-15T10:00:00Z",
      "completedAt": "2024-04-15T10:30:00Z",
      "status": "COMPLETED",
      "totalQuestions": 10,
      "answeredQuestions": 10,
      "correctAnswers": 9,
      "percentageCorrect": 90
    }
  ]
}
```

2. **Skill Performance Response**
```json
{
  "skillId": "skill123",
  "skillName": "JavaScript",
  "score": 90,
  "questionsAttempted": 20,
  "correctAnswers": 18,
  "incorrectAnswers": 2,
  "lastAttemptDate": "2024-04-15T10:30:00Z"
}
```

3. **Class Performance Response**
```json
{
  "gradeLevel": 10,
  "studentCount": 25,
  "averageScore": 82.5,
  "skillBreakdown": [
    {
      "skillId": "skill123",
      "skillName": "JavaScript",
      "averageScore": 85.5,
      "studentCount": 25
    }
  ]
}
```

### Recommended Response Format

1. **User Performance Response**
```json
{
  // Direct properties (legacy format)
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "username": "student1",
  "email": "student1@example.com",
  "gradeLevel": 10,
  "overallScore": 85.5,
  "assessmentCount": 10,
  "skillPerformance": [
    {
      "skillId": "skill123",
      "skillName": "JavaScript",
      "score": 90,
      "questionsAttempted": 20,
      "correctAnswers": 18,
      "incorrectAnswers": 2,
      "lastAttemptDate": "2024-04-15T10:30:00Z"
    }
  ],
  "recentAssessments": [
    {
      "id": "assessment123",
      "startedAt": "2024-04-15T10:00:00Z",
      "completedAt": "2024-04-15T10:30:00Z",
      "status": "COMPLETED",
      "totalQuestions": 10,
      "answeredQuestions": 10,
      "correctAnswers": 9,
      "percentageCorrect": 90
    }
  ],
  
  // Wrapped properties (new format)
  "success": true,
  "message": "User performance data retrieved successfully",
  "data": {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "username": "student1",
    "email": "student1@example.com",
    "gradeLevel": 10,
    "overallScore": 85.5,
    "assessmentCount": 10,
    "skillPerformance": [
      {
        "skillId": "skill123",
        "skillName": "JavaScript",
        "score": 90,
        "questionsAttempted": 20,
        "correctAnswers": 18,
        "incorrectAnswers": 2,
        "lastAttemptDate": "2024-04-15T10:30:00Z"
      }
    ],
    "recentAssessments": [
      {
        "id": "assessment123",
        "startedAt": "2024-04-15T10:00:00Z",
        "completedAt": "2024-04-15T10:30:00Z",
        "status": "COMPLETED",
        "totalQuestions": 10,
        "answeredQuestions": 10,
        "correctAnswers": 9,
        "percentageCorrect": 90
      }
    ]
  }
}
```

## Recommended Changes

1. Add `LegacyResponseInterceptor`:
```typescript
@UseInterceptors(LegacyResponseInterceptor)
@ApiExtraModels(ResponseWrapper, UserPerformanceDto, SkillPerformanceDto)
@Controller('analytics')
export class AnalyticsController {
  // ...
}
```

2. Update return types to use `ResponseWrapper`:
```typescript
@Get('user-performance')
async getUserPerformance(
  @Request() req: AuthenticatedRequest,
  @Query() queryParams: UserPerformanceQueryDto,
): Promise<ResponseWrapper<UserPerformanceDto>> {
  const result = await this.analyticsService.getUserPerformance(req.user.userId, queryParams);
  return createHybridResponse(
    result,
    'User performance data retrieved successfully'
  );
}
```

3. Update Swagger documentation:
```typescript
@ApiResponse({
  status: 200,
  description: 'Returns user performance data',
  schema: {
    allOf: [
      { $ref: getSchemaPath(ResponseWrapper) },
      {
        properties: {
          data: { $ref: getSchemaPath(UserPerformanceDto) }
        }
      }
    ]
  },
  content: {
    'application/json': {
      examples: {
        legacy: {
          summary: 'Legacy Format',
          value: {
            userId: '123e4567-e89b-12d3-a456-426614174000',
            username: 'student1',
            email: 'student1@example.com',
            gradeLevel: 10,
            overallScore: 85.5,
            assessmentCount: 10,
            skillPerformance: [
              {
                skillId: 'skill123',
                skillName: 'JavaScript',
                score: 90,
                questionsAttempted: 20,
                correctAnswers: 18,
                incorrectAnswers: 2,
                lastAttemptDate: '2024-04-15T10:30:00Z'
              }
            ],
            recentAssessments: [
              {
                id: 'assessment123',
                startedAt: '2024-04-15T10:00:00Z',
                completedAt: '2024-04-15T10:30:00Z',
                status: 'COMPLETED',
                totalQuestions: 10,
                answeredQuestions: 10,
                correctAnswers: 9,
                percentageCorrect: 90
              }
            ]
          }
        },
        wrapped: {
          summary: 'Wrapped Format',
          value: {
            success: true,
            message: 'User performance data retrieved successfully',
            data: {
              userId: '123e4567-e89b-12d3-a456-426614174000',
              username: 'student1',
              email: 'student1@example.com',
              gradeLevel: 10,
              overallScore: 85.5,
              assessmentCount: 10,
              skillPerformance: [
                {
                  skillId: 'skill123',
                  skillName: 'JavaScript',
                  score: 90,
                  questionsAttempted: 20,
                  correctAnswers: 18,
                  incorrectAnswers: 2,
                  lastAttemptDate: '2024-04-15T10:30:00Z'
                }
              ],
              recentAssessments: [
                {
                  id: 'assessment123',
                  startedAt: '2024-04-15T10:00:00Z',
                  completedAt: '2024-04-15T10:30:00Z',
                  status: 'COMPLETED',
                  totalQuestions: 10,
                  answeredQuestions: 10,
                  correctAnswers: 9,
                  percentageCorrect: 90
                }
              ]
            }
          }
        }
      }
    }
  }
})
```

4. Document role-based access:
```typescript
@ApiOperation({
  summary: 'Get user performance analytics',
  description: `
    Get performance data for the authenticated user or a specific user.
    - Regular users can only access their own performance data
    - Admins can access any user's performance data by providing userId
    - Teachers can access performance data for students in their grade level
  `
})
```

## Special Considerations

### 1. Role-Based Access Control
- Document access levels for each endpoint
- Clearly indicate which roles can access what data
- Include role requirements in Swagger documentation
- Document error responses for unauthorized access

### 2. Array Response Handling
- Implement pagination for assessment lists
- Include total count and page information
- Standardize array wrapper format

### 3. Error Handling
- Document role-based access errors
- Document validation errors
- Document not found errors

## Test Updates Needed

1. Array Format Tests:
```typescript
describe('GET /analytics/user-performance', () => {
  it('should return hybrid response with array data', async () => {
    const response = await request(app.getHttpServer())
      .get('/analytics/user-performance')
      .expect(200);
    
    // Check legacy array format
    expect(Array.isArray(response.body.skillPerformance)).toBe(true);
    expect(Array.isArray(response.body.recentAssessments)).toBe(true);
    
    // Check wrapped format
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.skillPerformance)).toBe(true);
    expect(Array.isArray(response.body.data.recentAssessments)).toBe(true);
  });
});
```

2. Role-Based Access Tests:
```typescript
describe('GET /analytics/class/:gradeLevel', () => {
  it('should allow admin access', async () => {
    const response = await request(app.getHttpServer())
      .get('/analytics/class/10')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });

  it('should allow teacher access', async () => {
    const response = await request(app.getHttpServer())
      .get('/analytics/class/10')
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });

  it('should deny student access', async () => {
    await request(app.getHttpServer())
      .get('/analytics/class/10')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);
  });
});
```

## Migration Steps

1. Add `LegacyResponseInterceptor` and `ApiExtraModels`
2. Update return types for all endpoints
3. Modify service methods to support pagination
4. Update tests for array responses
5. Update Swagger docs with array examples
6. Add deprecation notices for direct array responses
7. Document role-based access requirements
8. Update error response documentation 