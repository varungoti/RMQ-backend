# API Response Format Transition Guide

This document explains the current state of API response formats in our application and how to handle them during the transition period.

## Current State

We are transitioning from returning direct DTOs to using a consistent `ResponseWrapper` format across all API endpoints. During this transition period, to maintain backward compatibility, our API endpoints return **hybrid responses** that include:

1. The original DTO properties (legacy format)
2. The wrapped response properties (new format)

## Response Format Examples

### Legacy Format (Original)

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "userResponse": "A",
  "isCorrect": true,
  "answeredAt": "2023-06-15T14:30:45.123Z",
  "assessmentSession": {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "status": "IN_PROGRESS"
  },
  "question": {
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "questionText": "What is 2+2?",
    "questionType": "MCQ"
  }
}
```

### New Format (With ResponseWrapper)

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "userResponse": "A",
    "isCorrect": true,
    "answeredAt": "2023-06-15T14:30:45.123Z",
    "assessmentSession": {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "status": "IN_PROGRESS"
    },
    "question": {
      "id": "123e4567-e89b-12d3-a456-426614174002",
      "questionText": "What is 2+2?",
      "questionType": "MCQ"
    }
  },
  "message": "Answer submitted correctly"
}
```

### Current Hybrid Format

During the transition, responses include both formats:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "userResponse": "A",
  "isCorrect": true,
  "answeredAt": "2023-06-15T14:30:45.123Z",
  "assessmentSession": {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "status": "IN_PROGRESS"
  },
  "question": {
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "questionText": "What is 2+2?",
    "questionType": "MCQ"
  },
  "success": true,
  "data": {
    /* Same as the original DTO properties above */
  },
  "message": "Answer submitted correctly"
}
```

## Client Utilities

To help client applications handle both response formats consistently, we've provided utility functions in the `src/client-utils` directory:

### Available Utilities

- **api-response-handler.ts**: Contains general-purpose utility functions for client applications:
  - `isWrappedResponse()`: Checks if a response is in the wrapped format
  - `extractData()`: Gets the data from either response format
  - `isSuccessful()`: Checks if a response indicates success
  - `getMessage()`: Gets the message from a response with fallback
  - `processResponse()`: Comprehensive helper for handling responses

- **framework-examples.md**: Examples of integrating with popular frameworks:
  - React hook example
  - Angular service example
  - Vue composable example
  - Next.js API helper

### Using the Client Utilities

Copy the relevant utilities and examples to your client application. The utilities are framework-agnostic and can be used with any JavaScript or TypeScript client.

### Helper Utilities (Recommended)

We provide helper utilities to handle both response formats consistently. Import these from the `@/common/utils/response-helper` module:

```typescript
import { 
  extractResponseData, 
  isResponseSuccessful, 
  getResponseMessage 
} from '@/common/utils/response-helper';

// Example usage:
async function submitAnswer(sessionId, questionId, answer) {
  const response = await api.post('/assessment/submit', { 
    assessmentSessionId: sessionId, 
    questionId, 
    userResponse: answer 
  });
  
  // Extract the actual data regardless of format
  const result = extractResponseData(response);
  
  // Check if response indicates success
  const isSuccessful = isResponseSuccessful(response);
  
  // Get the message (falls back to default if not present)
  const message = getResponseMessage(response);
  
  return { 
    data: result,
    success: isSuccessful,
    message
  };
}
```

### Manual Handling

If you prefer to handle the response format manually, you can use this approach:

```typescript
function handleApiResponse(response) {
  // Check if this is the wrapped format
  const isWrappedFormat = 
    response && 
    typeof response === 'object' && 
    'success' in response && 
    'data' in response;
  
  // Get the actual data
  const data = isWrappedFormat ? response.data : response;
  
  // Now use the data
  return data;
}
```

## Transition Timeline

1. **Current Phase**: Hybrid responses that include both formats
2. **Next Phase** (Q3 2023): Deprecation notice for direct properties
3. **Final Phase** (Q4 2023): Only wrapped responses will be returned

## Backend Implementation

For backend developers adding new API endpoints, we've provided server-side utilities to make it easy to create hybrid responses:

1. **ResponseWrapper Class**: For wrapping responses consistently
2. **LegacyResponseInterceptor**: Auto-converts wrapped responses to hybrid format
3. **HybridResponse Type**: Provides TypeScript typing for hybrid responses
4. **createHybridResponse() Utility**: Helper for creating hybrid responses

Use the `createHybridResponse()` utility in your controllers:

```typescript
import { createHybridResponse } from '../common/utils/response-helper';

@Controller('my-resource')
export class MyController {
  @Get(':id')
  async getResource(@Param('id') id: string) {
    const result = await this.service.findById(id);
    return createHybridResponse(
      result,
      'Resource retrieved successfully',
      { additionalProperty: 'value' } // Optional additional properties
    );
  }
}
```

Or apply the interceptor at the controller level for automatic conversion:

```typescript
import { LegacyResponseInterceptor } from '../common/interceptors/legacy-response.interceptor';

@Controller('my-resource')
@UseInterceptors(LegacyResponseInterceptor)
export class MyController {
  // Now all endpoints will automatically convert wrapped responses to hybrid format
}
```

## Benefits of the New Format

The new `ResponseWrapper` format provides several benefits:

1. **Consistent Structure**: All API responses have the same structure
2. **Success Indicator**: The `success` property clearly indicates if the operation succeeded
3. **Message Field**: A human-readable message explains the result
4. **Error Handling**: Consistent format for both success and error responses

## Example Error Response

```json
{
  "success": false,
  "data": null,
  "message": "Question not found with ID: 123e4567-e89b-12d3-a456-426614174002"
}
```

This format makes client-side error handling more consistent and predictable.

## Client Integration Examples

### React Example (using helper utilities)

```tsx
import { useState, useEffect } from 'react';
import { extractResponseData, isResponseSuccessful, getResponseMessage } from '@/common/utils/response-helper';
import { toast } from 'your-toast-library';

function AssessmentQuestion({ sessionId }) {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchQuestion() {
      try {
        setLoading(true);
        const response = await fetch(`/api/assessment/session/${sessionId}/next`, {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          }
        }).then(res => res.json());
        
        // Check for success and show any message
        if (!isResponseSuccessful(response, 'success')) {
          toast.error(getResponseMessage(response, 'Failed to load question'));
          setError(new Error(getResponseMessage(response)));
          return;
        }
        
        // Extract the data
        const data = extractResponseData(response);
        
        // If assessment is complete, redirect
        if (data.isComplete) {
          window.location.href = `/assessment/${sessionId}/results`;
          return;
        }
        
        // Otherwise set the question
        setQuestion(data.nextQuestion);
        setError(null);
      } catch (err) {
        setError(err);
        toast.error('Failed to load question');
      } finally {
        setLoading(false);
      }
    }
    
    fetchQuestion();
  }, [sessionId]);
  
  // Component rendering...
}
```

### Angular Example

```typescript
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { extractResponseData, isResponseSuccessful, getResponseMessage } from '@/common/utils/response-helper';

@Component({
  selector: 'app-assessment',
  templateUrl: './assessment.component.html'
})
export class AssessmentComponent implements OnInit {
  sessionId: string;
  question: any = null;
  loading = true;
  error: string | null = null;
  
  constructor(private http: HttpClient) {
    this.sessionId = localStorage.getItem('currentSessionId') || '';
  }
  
  ngOnInit() {
    this.fetchQuestion();
  }
  
  async fetchQuestion() {
    try {
      this.loading = true;
      const response = await this.http.get(`/api/assessment/session/${this.sessionId}/next`)
        .toPromise();
      
      if (!isResponseSuccessful(response, 'success')) {
        this.error = getResponseMessage(response, 'Failed to load question');
        return;
      }
      
      const data = extractResponseData(response);
      
      if (data.isComplete) {
        window.location.href = `/assessment/${this.sessionId}/results`;
        return;
      }
      
      this.question = data.nextQuestion;
      this.error = null;
    } catch (err) {
      this.error = 'Failed to load question';
    } finally {
      this.loading = false;
    }
  }
}
```

## Questions and Support

If you have questions about the transition or need assistance updating your client code, please contact the API team. 