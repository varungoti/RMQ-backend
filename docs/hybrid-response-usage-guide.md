# Hybrid Response Usage Guide

## Overview

The `createHybridResponse` function is used throughout the codebase to create a consistent response format that works with both legacy clients and newer API consumers. It's important to use this function correctly to avoid unexpected properties in the response that could break tests or client applications.

## Function Signature

```typescript
function createHybridResponse<T>(
  data: T | null, 
  message: string = '', 
  successOrProps: boolean | Record<string, any> = true
): any
```

## Parameters

1. `data`: The main data object to include in the response
2. `message`: A string message to include in the response
3. `successOrProps`: This parameter affects the response structure:
   - If a boolean: Sets only the 'success' property
   - If an object: Adds all properties from the object to the response

## Correct Usage

### When you want to set the success state:

```typescript
// CORRECT - Pass boolean directly
createHybridResponse(
  result,
  'Operation successful',
  true  // or result.isCorrect, etc.
);
```

This creates a response with:
- All properties from result
- success = true
- message = 'Operation successful'
- data = result

### When you need to add additional properties:

```typescript
// ACCEPTABLE - Add properties other than 'correct'
createHybridResponse(
  result,
  'Operation successful',
  { 
    additionalProp1: 'value1',
    additionalProp2: 'value2'
  }
);
```

## Incorrect Usage

### NEVER do this:

```typescript
// INCORRECT - Don't pass an object with 'correct' property
createHybridResponse(
  result,
  'Operation successful',
  { correct: result.isCorrect }  // ❌ WRONG!
);
```

This adds a redundant `correct` property to the response, causing tests to fail and potentially breaking client applications expecting a specific format.

## Checking Your Code

We have several tools to help ensure correct usage:

1. Run `npm run check:hybrid-response` to scan for problematic usage
2. Run `npm run lint:hybrid-response` to use our custom ESLint rule
3. Run `npm run test:verify-hybrid-fix` to run verification tests

## Why This Matters

Using the function incorrectly can:
1. Break tests expecting specific response formats
2. Cause TypeScript errors
3. Create inconsistent API responses
4. Confuse API consumers when properties appear in unexpected places 