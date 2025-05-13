# API Documentation Review Checklist

## Response Format Verification

### 1. Controller Setup
- [ ] Uses `@UseInterceptors(LegacyResponseInterceptor)`
- [ ] Includes `@ApiExtraModels(ResponseWrapper, ...DTOs)`
- [ ] Returns `Promise<ResponseWrapper<T>>` types
- [ ] Uses `createHybridResponse` consistently

### 2. Swagger Documentation
- [ ] Documents both legacy and wrapped formats
- [ ] Uses `getSchemaPath` for schema references
- [ ] Includes response examples
- [ ] Documents error responses

### 3. Array Response Handling
- [ ] Wraps arrays in `items` property
- [ ] Includes pagination information when applicable
- [ ] Documents array format in examples
- [ ] Handles empty arrays correctly

### 4. Error Response Format
- [ ] Uses consistent error response structure
- [ ] Includes error codes and messages
- [ ] Documents error scenarios
- [ ] Provides error examples

## Documentation Quality

### 1. Method Documentation
- [ ] Clear method summaries
- [ ] Detailed descriptions
- [ ] Parameter documentation
- [ ] Return type documentation

### 2. Response Examples
- [ ] Legacy format example
- [ ] Wrapped format example
- [ ] Error format example
- [ ] Array format example (if applicable)

### 3. Parameter Documentation
- [ ] Query parameters documented
- [ ] Path parameters documented
- [ ] Body parameters documented
- [ ] Header parameters documented

### 4. Security Documentation
- [ ] Authentication requirements
- [ ] Authorization requirements
- [ ] Rate limiting information
- [ ] API key requirements

## Response Format Examples

### Single Item Response
```json
{
  // Legacy format
  "id": "123",
  "name": "Example",
  
  // Wrapped format
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": "123",
    "name": "Example"
  }
}
```

### Array Response
```json
{
  // Legacy format
  "items": [
    { "id": "1", "name": "First" },
    { "id": "2", "name": "Second" }
  ],
  
  // Wrapped format
  "success": true,
  "message": "Items retrieved successfully",
  "data": {
    "items": [
      { "id": "1", "name": "First" },
      { "id": "2", "name": "Second" }
    ],
    "total": 2
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Operation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": ["Field 'name' is required"]
  }
}
```

## Implementation Checklist

### 1. Response Wrapper
- [ ] Consistent use of `success` boolean
- [ ] Meaningful message strings
- [ ] Proper error handling
- [ ] Correct data nesting

### 2. Legacy Compatibility
- [ ] Direct properties preserved
- [ ] No breaking changes
- [ ] Deprecation notices added
- [ ] Migration path documented

### 3. Type Safety
- [ ] TypeScript types defined
- [ ] Response interfaces documented
- [ ] Generic type parameters used
- [ ] Type guards implemented

### 4. Testing Coverage
- [ ] Response format tests
- [ ] Error handling tests
- [ ] Array handling tests
- [ ] Edge case tests

## Common Issues to Check

1. Response Structure
   - [ ] No duplicate properties
   - [ ] Consistent property naming
   - [ ] Proper nesting
   - [ ] Correct types

2. Documentation
   - [ ] No outdated examples
   - [ ] All status codes documented
   - [ ] Clear error descriptions
   - [ ] Migration notes included

3. Error Handling
   - [ ] HTTP status codes match errors
   - [ ] Error messages are helpful
   - [ ] Stack traces hidden in production
   - [ ] Validation errors properly formatted

4. Performance
   - [ ] No unnecessary data in responses
   - [ ] Proper pagination
   - [ ] Efficient data loading
   - [ ] Response size optimization

## Migration Notes

### Current Phase
- Both legacy and wrapped formats included
- No deprecation notices yet
- All controllers being updated

### Next Phase
- Add deprecation notices
- Monitor usage of legacy format
- Gather feedback on new format

### Final Phase
- Remove legacy format
- Only wrapped responses
- Update all documentation
- Remove transition code 