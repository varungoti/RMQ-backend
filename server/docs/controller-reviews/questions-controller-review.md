# QuestionsController Documentation Review

## Current Implementation

The QuestionsController currently returns direct entity responses without using the hybrid response format:

```typescript
@Controller('questions')
export class QuestionsController {
  @Get()
  findAll(): Promise<Question[]> {
    return this.questionsService.findAll();
  }
}
```

### Areas for Improvement

1. Not using `LegacyResponseInterceptor`
2. Direct entity responses without wrapping
3. Swagger documentation doesn't reflect future response format
4. No handling for sensitive data (`correctAnswer` field)
5. Array response format needs standardization

### Current Response Format

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "questionText": "What is 2 + 2?",
  "questionType": "MCQ",
  "options": {
    "choices": ["A", "B", "C", "D"]
  },
  "correctAnswer": "A", // This should not be exposed!
  "difficultyLevel": 3,
  "gradeLevel": 5
}
```

### Recommended Response Format

```json
{
  // Direct properties (legacy format)
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "questionText": "What is 2 + 2?",
  "questionType": "MCQ",
  "options": {
    "choices": ["A", "B", "C", "D"]
  },
  "difficultyLevel": 3,
  "gradeLevel": 5,
  
  // Wrapped properties (new format)
  "success": true,
  "message": "Question retrieved successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "questionText": "What is 2 + 2?",
    "questionType": "MCQ",
    "options": {
      "choices": ["A", "B", "C", "D"]
    },
    "difficultyLevel": 3,
    "gradeLevel": 5
  }
}
```

### Array Response Format (findAll)

```json
{
  // Direct properties (legacy format)
  "items": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "questionText": "What is 2 + 2?",
      "questionType": "MCQ",
      "options": {
        "choices": ["A", "B", "C", "D"]
      },
      "difficultyLevel": 3,
      "gradeLevel": 5
    }
  ],
  
  // Wrapped properties (new format)
  "success": true,
  "message": "Questions retrieved successfully",
  "data": {
    "items": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "questionText": "What is 2 + 2?",
        "questionType": "MCQ",
        "options": {
          "choices": ["A", "B", "C", "D"]
        },
        "difficultyLevel": 3,
        "gradeLevel": 5
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

## Recommended Changes

1. Add `LegacyResponseInterceptor` and exclude sensitive data:
```typescript
@UseInterceptors(LegacyResponseInterceptor, ClassSerializerInterceptor)
@ApiExtraModels(ResponseWrapper, Question)
@Controller('questions')
export class QuestionsController {
  // ...
}
```

2. Update return types to use `ResponseWrapper`:
```typescript
@Get()
async findAll(
  @Query('page') page = 1,
  @Query('pageSize') pageSize = 10
): Promise<ResponseWrapper<PaginatedResponse<Question>>> {
  const result = await this.questionsService.findAll(page, pageSize);
  return createHybridResponse(
    { items: result.items, total: result.total },
    'Questions retrieved successfully'
  );
}
```

3. Update Swagger documentation:
```typescript
@ApiResponse({
  status: 200,
  description: 'List of questions retrieved successfully.',
  schema: {
    allOf: [
      { $ref: getSchemaPath(ResponseWrapper) },
      {
        properties: {
          data: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { $ref: getSchemaPath(Question) }
              },
              total: {
                type: 'number',
                description: 'Total number of items'
              }
            }
          }
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
            items: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                questionText: 'What is 2 + 2?',
                questionType: 'MCQ',
                options: { choices: ['A', 'B', 'C', 'D'] },
                difficultyLevel: 3,
                gradeLevel: 5
              }
            ]
          }
        },
        wrapped: {
          summary: 'Wrapped Format',
          value: {
            success: true,
            message: 'Questions retrieved successfully',
            data: {
              items: [
                {
                  id: '123e4567-e89b-12d3-a456-426614174000',
                  questionText: 'What is 2 + 2?',
                  questionType: 'MCQ',
                  options: { choices: ['A', 'B', 'C', 'D'] },
                  difficultyLevel: 3,
                  gradeLevel: 5
                }
              ],
              total: 1
            }
          }
        }
      }
    }
  }
})
```

4. Add pagination support:
```typescript
@ApiQuery({ name: 'page', required: false, type: 'number', description: 'Page number (1-based)' })
@ApiQuery({ name: 'pageSize', required: false, type: 'number', description: 'Items per page' })
```

## Test Updates Needed

1. Array Format Tests:
```typescript
describe('GET /questions', () => {
  it('should return hybrid response with array data', async () => {
    const response = await request(app.getHttpServer())
      .get('/questions')
      .expect(200);
    
    // Check legacy array format
    expect(Array.isArray(response.body.items)).toBe(true);
    
    // Check wrapped format
    expect(response.body.success).toBe(true);
    expect(response.body.data.items).toBeDefined();
    expect(response.body.data.total).toBeDefined();
    
    // Verify sensitive data is not exposed
    const question = response.body.items[0];
    expect(question).not.toHaveProperty('correctAnswer');
  });
});
```

## Migration Steps

1. Add `LegacyResponseInterceptor` and `ClassSerializerInterceptor`
2. Update return types for array endpoints
3. Modify service methods to support pagination
4. Update tests for array responses
5. Update Swagger docs with array examples
6. Add deprecation notices for direct array responses
7. Ensure `correctAnswer` is properly excluded from responses 