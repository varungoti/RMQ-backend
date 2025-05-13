# Test Directory

This directory contains test files for the server application.

## End-to-End (E2E) Tests

The end-to-end tests verify the functionality of the entire application by simulating HTTP requests and verifying responses.

### Running E2E Tests

```bash
# Run all E2E tests
pnpm --filter server test:e2e

# Run a specific test file
pnpm --filter server test:e2e -- test/assessment.e2e-spec.ts

# Run with verbose output
pnpm --filter server test:e2e -- test/assessment.e2e-spec.ts --verbose
```

## Verification Tests

### createHybridResponse Verification Tests

The following tests were created to verify the fix for the `createHybridResponse` function call in the controller:

- `verify-controller-fix.js` - Tests both incorrect and correct usage of the function in the controller
- `verify-new-hybrid-response.js` - Tests the improved `createHybridResponse` function with various inputs
- `hybrid-response-test.js` - Tests the manual implementation of the function with different use cases

These tests confirm that passing a boolean as the third parameter to `createHybridResponse` correctly sets the `success` property without adding an unwanted `correct` property.

### Running Verification Tests

```bash
# Run the controller fix verification
node test/verify-controller-fix.js

# Run the new implementation verification
node test/verify-new-hybrid-response.js

# Run the hybrid response test
node test/hybrid-response-test.js
```

## Jest Configuration

The Jest configuration for E2E tests is in `jest-e2e.json`. Key configuration points:

- `moduleNameMapper` - Maps import paths to their actual locations
- `transformIgnorePatterns` - Prevents transformation of node_modules
- `setupFiles` - Runs setup-env.ts before tests to load environment variables

## Mock Files

- `__mocks__/source-map.js` - Provides a mock implementation of the source-map module for tests

## Documentation

For more information about the `createHybridResponse` function and the fix implemented, see:
- `server/docs/hybrid-response-fix.md` - Detailed documentation about the issue and solution
- `server/src/common/utils/response-helper.ts` - The implementation with JSDoc documentation 