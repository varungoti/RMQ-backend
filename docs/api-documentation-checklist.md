# API Documentation Review Checklist

Use this checklist when reviewing and refining the Swagger/OpenAPI documentation for controllers.

## Controller-Level Decorators

- [ ] `@ApiTags('ControllerName')` is present
- [ ] `@ApiBearerAuth()` is present (if authentication is required)
- [ ] `@ApiExtraModels()` includes all DTOs used in the controller
- [ ] `@UseInterceptors()` properly configured for response transformation

## Endpoint-Level Decorators (for each endpoint)

- [ ] `@ApiOperation()` with clear summary and description
- [ ] `@ApiResponse()` for all possible status codes:
  - [ ] 200/201 Success responses
  - [ ] 400 Bad Request (validation errors)
  - [ ] 401 Unauthorized (if authentication required)
  - [ ] 403 Forbidden (if authorization required)
  - [ ] 404 Not Found (if applicable)
  - [ ] 500 Server Error (if applicable)
- [ ] `@ApiBody()` for POST/PUT/PATCH endpoints
- [ ] `@ApiParam()` for each path parameter
- [ ] `@ApiQuery()` for each query parameter

## Response Schema Documentation

- [ ] Uses `schema` property in `@ApiResponse` for structured responses
- [ ] Correctly references DTOs using `{ $ref: getSchemaPath(MyDto) }`
- [ ] For hybrid responses, uses `allOf` to combine wrapper and direct properties
- [ ] Includes practical examples using the `content` property
- [ ] Success response schema matches actual controller return type

## DTO Documentation

- [ ] All properties have `@ApiProperty()` or `@ApiPropertyOptional()`
- [ ] All decorators include `description`
- [ ] Properties with specific formats include `example`
- [ ] Enums are properly documented with `enum` and `enumName`
- [ ] Nested DTOs are properly referenced
- [ ] Array properties specify `type` and `isArray: true`

## Hybrid Response Handling

- [ ] Uses `ResponseWrapper` consistently
- [ ] Uses `createHybridResponse` correctly (boolean parameter, not object)
- [ ] Response schema accurately documents both direct and wrapped formats
- [ ] No redundant properties in responses (e.g., avoid `correct` when `isCorrect` exists)

## Documentation Quality

- [ ] Descriptions are clear and concise
- [ ] Examples are realistic and valid
- [ ] Error scenarios are well documented
- [ ] Consistent terminology is used throughout
- [ ] Authentication/authorization requirements are clear

## Verification

- [ ] Manually test Swagger UI to confirm documentation accuracy
- [ ] Verify actual API responses match documented schemas
- [ ] API consumers can understand the response format without additional explanation 