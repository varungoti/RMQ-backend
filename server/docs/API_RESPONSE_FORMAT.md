# API Response Format Documentation

## Overview

This document outlines the standardized API response format used across the RMQ application. Our API follows a consistent pattern to ensure predictable responses for clients.

## Standard Response Format

All API endpoints return responses in the following format:

```json
{
  "success": true|false,
  "data": {
    // Response data goes here (varies by endpoint)
  },
  "message": "Optional message providing additional context"
}
```

### Fields

- **success**: Boolean indicating if the request was successful
- **data**: The main response payload (endpoint-specific data)
- **message**: Optional field providing additional information about the operation

## Success Responses

Successful responses have `success: true` and include the requested data:

```json
{
  "success": true,
  "data": {
    "id": "f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454",
    "name": "Example Data"
  },
  "message": "Operation completed successfully"
}
```

## Error Responses

Error responses have `success: false` and include an error message:

```json
{
  "success": false,
  "data": null,
  "message": "Resource not found"
}
```

The HTTP status code will also reflect the error type (e.g., 404 for "Not Found").

## Legacy Support

For backward compatibility, some endpoints may include additional properties at the root level:

- **correct**: Boolean indicating if an assessment answer was correct (only present in assessment submission responses)

This will be phased out in future versions.

## Examples

### Assessment Submission Response

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userResponse": "A",
    "isCorrect": true,
    "answeredAt": "2023-11-20T12:30:45.000Z",
    "responseTimeMs": 1500,
    "assessmentSession": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "status": "in_progress"
    },
    "question": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "questionText": "What is 2+2?",
      "questionType": "MCQ",
      "options": {
        "A": "4",
        "B": "3",
        "C": "5",
        "D": "6"
      },
      "difficultyLevel": 1
    }
  },
  "message": "Answer submitted correctly",
  "correct": true
}
```

### Next Question Response

```json
{
  "success": true,
  "data": {
    "isComplete": false,
    "nextQuestion": {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "questionText": "What is the capital of France?",
      "type": "MCQ",
      "options": {
        "A": "Paris",
        "B": "London",
        "C": "Berlin",
        "D": "Madrid"
      },
      "difficultyLevel": 2
    }
  },
  "message": "Next question retrieved"
}
```

## Migration Guide

If you are using an older version of the API, you should migrate to the new format by:

1. Checking the `success` field to determine if the request was successful
2. Accessing response data through the `data` field
3. Using `message` for informational or error messages

## Future Enhancements

Future versions of the API may include:

- Request IDs for better tracing
- Performance metrics
- Pagination information for list endpoints 