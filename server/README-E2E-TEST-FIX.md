# E2E Test Compatibility Fix

## Issue Identified

The NestJS E2E tests are failing with:

```
TypeError: Class extends value undefined is not a constructor or null
```

This occurs when trying to import NestJS modules via ES6 import syntax in Jest environment.

## Root Cause

1. The tests fail when using direct imports like `import { Test } from '@nestjs/testing'`
2. The issue is related to how Jest mocks modules in the testing environment
3. The `setup-jest.js` file contains mocks that interfere with NestJS classes

## Solutions

### Solution 1: Use require() syntax (Recommended)

Convert all NestJS imports in test files to use `require()` syntax:

```typescript
// Ensure reflect-metadata is loaded first
require('reflect-metadata');

// Convert imports to require syntax
const { Test } = require('@nestjs/testing');
const { ValidationPipe } = require('@nestjs/common');
```

And replace TypeScript type annotations:

```typescript
// Replace 
let app: INestApplication;

// With
let app: any; // INestApplication
```

### Solution 2: Use a custom Jest config

Create a copy of the Jest config that doesn't include the setup-jest.js file:

```javascript
// jest-debug-config.js
module.exports = {
  // Same as jest-e2e.json but without setup-jest.js
  setupFiles: [
    "<rootDir>/setup-env.ts"
    // Removed setup-jest.js
  ],
}
```

Then run tests with this config:

```
pnpm test:e2e -- --config=./test/jest-debug-config.js test/your-test.e2e-spec.ts
```

### Solution 3: Create simplified tests

For testing specific components without NestJS dependencies, create simplified tests:

```typescript
// minimal-assessment.e2e-spec.ts
require('reflect-metadata');
const { createHybridResponse } = require('../src/common/utils/response-helper');

describe('Function Tests', () => {
  it('should test function directly', () => {
    const result = createHybridResponse({id: '123'}, 'message', true);
    expect(result.success).toBe(true);
  });
});
```

## Response Format Issue

A separate issue was identified with the `createHybridResponse` function:

1. When passing an object as the third parameter, it adds all properties of that object to the response
2. This causes tests to fail when checking for specific properties

### Correct Usage:

```typescript
// CORRECT - Use a boolean for the third parameter
return createHybridResponse(
  result,
  'Answer submitted correctly',
  result.isCorrect // boolean
);
```

### Incorrect Usage:

```typescript
// INCORRECT - Passing an object adds unwanted properties
return createHybridResponse(
  result,
  'Answer submitted correctly',
  { correct: result.isCorrect } // object with properties
);
```

## Recommendations

1. Review all usages of `createHybridResponse` to ensure they use a boolean as the third parameter
2. For new tests, consider using the require() syntax pattern
3. Document this issue in the codebase to prevent future regressions

## References

- [Jest Mocking](https://jestjs.io/docs/manual-mocks)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing) 