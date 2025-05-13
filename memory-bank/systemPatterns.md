# System Patterns: Learner Insights

## 1. High-Level Architecture

We will adopt a modular, service-oriented architecture to facilitate scalability and maintainability. The key components will include:

*   **Frontend Application(s):** Mobile app (likely cross-platform: React Native/Flutter) for students/parents, and potentially a separate Web Application for School/Admin portals.
*   **Backend API:** A central API (e.g., REST or GraphQL) built with Node.js/Python/Ruby/Java to handle business logic, data access, and communication between frontend and backend services.
*   **Database:** A relational database (e.g., PostgreSQL) for structured user data, question metadata, course structures, and results. Potentially supplemented by NoSQL or specialized databases if needed (e.g., for large text content or graph relationships).
*   **Assessment Engine:** A dedicated service or module responsible for implementing the adaptive testing logic (IRT or heuristics) and selecting questions.
*   **Reporting Engine:** A service to process raw assessment results, apply scoring/scaling logic, generate insights, and create visual report data (potentially leveraging a charting library server-side or passing data to the client).
*   **E-Learning Service:** Manages course content delivery, tracks progress, and handles interactive elements.
*   **Content Management System (CMS):** Backend interface for admins/SMEs to manage the question bank and e-learning course content.

```mermaid
flowchart TD
    subgraph User Interfaces
        MobileApp[Mobile App (Student/Parent)]
        WebApp[Web App (School/Admin)]
    end

    subgraph Backend Services
        API[Backend API Gateway]
        Auth[Authentication Service]
        Assessment[Assessment Engine]
        Reporting[Reporting Engine]
        Elearning[E-Learning Service]
        CMS[Content Management System]
    end

    subgraph Data Stores
        DB[(Relational DB)]
        QBank[(Question Bank)]
        Courses[(Course Content Store)]
        Reports[(Report Data Store)]
    end

    MobileApp --> API
    WebApp --> API
    
    API --> Auth
    API --> Assessment
    API --> Reporting
    API --> Elearning
    API --> CMS

    Auth --> DB
    Assessment --> QBank
    Assessment --> DB
    Reporting --> DB
    Reporting --> Reports
    Elearning --> Courses
    Elearning --> DB
    CMS --> QBank
    CMS --> Courses
    CMS --> DB
```

## 2. Key Technical Decisions (Initial Thoughts)

*   **Cross-Platform Mobile App:** Likely React Native or Flutter for efficiency across iOS and Android.
*   **Backend Language/Framework:** Node.js (TypeScript) or Python (Django/Flask) are strong contenders due to ecosystem and developer availability.
*   **Database:** PostgreSQL is a robust default choice for relational data.
*   **Adaptive Logic:** Start with a well-defined heuristic model for the MVP, plan for potential migration to Item Response Theory (IRT) post-validation for higher accuracy.
*   **Content Storage:** Course videos likely hosted on specialized services (Vimeo/Wistia). Question text/metadata in the primary DB.

## 3. Design Patterns

*   **Modular Design:** Each service/module should have clear responsibilities and minimal dependencies. (Implemented via NestJS Modules)
*   **API-First:** Design the API contract early to facilitate parallel frontend/backend development. (Using DTOs and planning via tasks.md)
*   **Role-Based Access Control (RBAC):** Utilize NestJS Guards (`JwtAuthGuard`, `RolesGuard`) and custom Decorators (`@Roles`) to control access based on user roles defined in the `User` entity (`UserRole` enum).
*   **Asynchronous Processing:** Use message queues (e.g., RabbitMQ, Kafka) for tasks like report generation or complex analysis if needed to avoid blocking API responses.
*   **State Management (Frontend):** Utilize modern state management libraries (Zustand, Redux Toolkit, TanStack Query) appropriate for the chosen framework.

*(This section will evolve as specific implementation choices are made)* 

## LLM Provider Architecture

We've implemented a flexible LLM provider system using a combination of design patterns:

### 1. Abstract Factory Pattern

The LLM provider system uses an abstract factory pattern that enables different LLM implementations to be used interchangeably:

```
┌───────────────────┐     ┌────────────────────┐
│                   │     │                    │
│  LlmProviderType  │     │ LlmProviderConfig  │
│    (enum)         │     │    (dto)           │
│                   │     │                    │
└─────────┬─────────┘     └────────┬───────────┘
          │                        │
          │                        │
          ▼                        ▼
┌───────────────────────────────────────────────┐
│                                               │
│            LlmProviderService                 │
│           (abstract class)                    │
│                                               │
└───────────────────┬───────────────────────────┘
                    │
                    │
          ┌─────────┼─────────┬──────────┐
          │         │         │          │
          ▼         ▼         ▼          ▼
┌────────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐
│ OpenAI     │ │ Gemini  │ │Anthropic│ │Cohere  │
│ Provider   │ │Provider │ │Provider │ │Provider│
└────────────┘ └─────────┘ └─────────┘ └────────┘
```

### 2. Factory Service Pattern

The `LlmFactoryService` manages the creation and access of various LLM providers:

```
┌───────────────────────────────────────┐
│                                       │
│            LlmFactoryService          │
│                                       │
├───────────────────────────────────────┤
│ - providers: Map<Type, Provider>      │
│ - defaultProvider: LlmProviderType    │
├───────────────────────────────────────┤
│ + getProvider(type): LlmProviderService │
│ + getDefaultProvider(): LlmProviderService │
│ + setDefaultProvider(type): boolean   │
│ + getAllProviders(): Map              │
│ + isAnyProviderEnabled(): boolean     │
└───────────────────────────────────────┘
```

### 3. Strategy Pattern

The system allows runtime switching between different LLM strategies:

```
┌───────────────────┐      ┌───────────────────┐
│                   │      │                   │
│ RecommendationsCtrl │◄───│ LlmFactoryService │
│                   │      │                   │
└─────────┬─────────┘      └────────┬──────────┘
          │                         │
          ▼                         ▼
┌───────────────────┐      ┌───────────────────┐
│                   │      │                   │
│ AiRecommendation  │◄─────┤ LlmProviderService│
│ Service           │      │ (current strategy)│
│                   │      │                   │
└───────────────────┘      └───────────────────┘
```

### 4. Dependency Injection

NestJS's DI system allows for seamless integration of providers and services:

```typescript
@Module({
  providers: [LlmFactoryService, LlmCacheService],
  exports: [LlmFactoryService, LlmCacheService],
})
export class LlmModule {}

@Module({
  imports: [
    // ...other imports
    LlmModule,
  ],
  providers: [RecommendationsService, AiRecommendationService],
  exports: [RecommendationsService, AiRecommendationService],
})
export class RecommendationsModule {}
```

### 5. Adapter Pattern

Each LLM provider adapts the specific API of each service to our common interface:

```typescript
abstract class LlmProviderService {
  abstract sendPrompt(prompt: string, systemPrompt?: string): Promise<LlmResponse>;
}
```

## LLM Caching Architecture

We've implemented a caching layer for LLM responses to reduce API costs and improve performance:

```
┌───────────────────┐    ┌───────────────────┐
│                   │    │                   │
│ AiRecommendation  │    │ LlmFactoryService │
│ Service           │    │                   │
│                   │    │                   │
└─────────┬─────────┘    └─────────┬─────────┘
          │                        │
          │ Uses                   │ Creates/Manages
          ▼                        ▼
┌───────────────────────────────────────────────┐
│                                               │
│            LlmProviderService                 │
│           (with caching)                      │
│                                               │
└───────────────────┬───────────────────────────┘
                    │
                    │ Uses
                    ▼
┌───────────────────────────────────────────────┐
│                                               │
│            LlmCacheService                    │
│           (in-memory cache)                   │
│                                               │
└───────────────────────────────────────────────┘
```

### 1. Cache-Aside Pattern

The LLM provider system uses a cache-aside pattern:

1. When a prompt is received, the system first checks if a response exists in the cache
2. If found (cache hit), return the cached response
3. If not found (cache miss), send the prompt to the LLM provider
4. Store the successful response in the cache for future use

### 2. Multi-Level Caching

The system implements a tiered caching approach:

```
┌───────────────────────────────────────────────┐
│                                               │
│            ILlmCacheService                   │
│           (Common Interface)                  │
│                                               │
└─────────────────┬───────────────┬─────────────┘
                  │               │
     ┌────────────▼──────┐  ┌─────▼──────────────┐
     │                   │  │                    │
     │ LlmRedisCacheService│  │  LlmCacheService  │
     │ (Persistent)      │  │  (In-Memory)      │
     │                   │  │                    │
     └───────────────────┘  └────────────────────┘
```

1. **Level 1 (Redis)**: Persistent, distributed cache with longer TTL
   - Shared across service instances
   - Survives application restarts
   - Higher capacity (10K+ entries)
   - Longer expiration times (24+ hours)

2. **Level 2 (In-Memory Map)**: Fast, local cache
   - Instance-specific
   - Very low latency
   - Limited capacity (~1K entries)
   - Shorter expiration times (~1 hour)
   - Used as fallback when Redis is unavailable

The factory dynamically selects the appropriate cache implementation:
```typescript
// Check if Redis cache is available and enabled
const redisEnabled = this.configService.get<boolean>('REDIS_CACHE_ENABLED') || false;
const cacheToUse: ILlmCacheService = redisEnabled && this.redisCacheService 
  ? this.redisCacheService 
  : this.cacheService;
```

### 3. Graceful Degradation

The caching system implements graceful degradation:

```typescript
// Redis error handling with fallback
try {
  const cachedValue = await this.cacheManager.get<LlmResponse>(cacheKey);
  // Process cached value
} catch (error) {
  this.logger.error(`Error retrieving from Redis cache: ${error.message}`, error.stack);
  // On Redis error, fall back to in-memory cache
  if (this.inMemoryFallback) {
    this.logger.log('Falling back to in-memory cache due to Redis error');
    return this.inMemoryCache.get(prompt, systemPrompt, provider, model);
  }
}
```

This ensures:
1. System continues to function if Redis is unavailable
2. Errors are properly logged for monitoring
3. Performance impact is minimized during outages
4. No single point of failure in the caching layer

### 4. Type-Safe Configuration

The Redis cache module uses TypeScript to ensure type safety:

```typescript
// Define the Redis store configuration type
type RedisStoreConfig = {
  store: string;
  host: string;
  port: number;
  ttl: number;
  max: number;
  password: string | undefined;
};

// Use async factory pattern with proper typing
useFactory: async (configService: ConfigService) => {
  if (redisEnabled) {
    const redisConfig: RedisStoreConfig = {
      store: 'redis',
      // Other properties...
    };
    return redisConfig;
  }
  
  // Type-safe fallback for in-memory config
  const inMemoryConfig: any = {
    ttl: configService.get<number>('LLM_CACHE_TTL_SECONDS') || 3600,
    max: configService.get<number>('LLM_CACHE_MAX_SIZE') || 1000,
  };
  
  return inMemoryConfig;
}
```

This approach ensures type safety while still supporting both Redis and in-memory caching options.

### 5. Cache Key Generation

Cache keys are generated using a deterministic hash function:

```typescript
private generateCacheKey(prompt: string, systemPrompt: string | undefined, provider: string, model: string): string {
  // Create a deterministic string that represents the request
  const requestString = JSON.stringify({
    prompt,
    systemPrompt,
    provider,
    model,
  });
  
  // Create a hash of the request string
  return crypto.createHash('md5').update(requestString).digest('hex');
}
```

### 6. Cache Metrics Collection

The caching system collects detailed performance metrics:

```typescript
interface CacheMetrics {
  hits: number;        // Number of successful cache retrievals
  misses: number;      // Number of cache lookup failures
  totalRequests: number; // Total lookup attempts
  evictions: number;   // Number of entries removed due to size limits
  expirations: number; // Number of entries expired by TTL
  hitRatio: number;    // hits / totalRequests
}
```

These metrics provide insights into cache effectiveness and can be monitored through admin endpoints:

- `GET /recommendations/llm/cache/stats`: View cache stats and metrics
- `POST /recommendations/llm/cache/clear`: Clear the entire cache
- `POST /recommendations/llm/cache/reset-metrics`: Reset just the metrics counters

### 7. Administrator Control

The cache system includes admin endpoints for managing and monitoring:

- `GET /recommendations/llm/cache/stats`: View current cache statistics
- `POST /recommendations/llm/cache/clear`: Clear the entire cache
- `POST /recommendations/llm/cache/reset-metrics`: Reset performance metrics

### 8. NestJS Dependency Injection Patterns

The caching system follows proper NestJS dependency injection practices:

1. **Module Structure**: Each module explicitly declares its dependencies and providers
```typescript
@Module({
  imports: [CacheModule],
  providers: [LlmRedisCacheService, LlmCacheService],
  exports: [LlmRedisCacheService, CacheModule],
})
export class LlmRedisCacheModule {}
```

2. **Provider Injection**: Services are properly injected using constructor injection
```typescript
constructor(
  private configService: ConfigService,
  @Inject(CACHE_MANAGER) private cacheManager: Cache,
  private inMemoryCache: LlmCacheService
) { }
```

3. **Return Type Consistency**: Methods maintain consistent return types for controller compatibility
```typescript
// Factory service transforms different cache implementations to a consistent return type
async getCacheStats(): Promise<{ enabled: boolean; size: number; maxSize: number; ttlSeconds: number; metrics: any }> {
  // Transform Redis stats to match the expected return type
  return {
    enabled: redisStats.enabled,
    size: 0,
    maxSize: 0,
    ttlSeconds: redisStats.ttlSeconds,
    metrics: redisStats.metrics
  };
}
```

4. **Async Pattern**: Methods consistently use async/await for both sync and async operations
```typescript
// Controller properly awaits async methods
async resetLlmCacheMetrics(): Promise<{ success: boolean; message: string }> {
  await this.llmFactory.resetCacheMetrics();
  return { success: true, message: 'LLM cache metrics reset successfully' };
}
```

### 9. Prompt Normalization and Cache Invalidation

The caching system includes advanced features to optimize hit rates and maintain consistency:

#### Prompt Normalization

To improve cache hit rates, prompts are normalized before generating cache keys:

```typescript
private normalizePrompt(prompt: string): string {
  if (!prompt) return '';
  
  const normalized = prompt
    // Convert to lowercase
    .toLowerCase()
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Trim leading/trailing whitespace
    .trim()
    // Remove punctuation that doesn't affect meaning
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    // Remove extra quotes
    .replace(/"|'/g, '');
    
  // Handle very long prompts
  if (normalized.length > MAX_PROMPT_LENGTH) {
    // Take first part + digest of full content + last part
    const firstPart = normalized.substring(0, MAX_PROMPT_LENGTH / 2);
    const lastPart = normalized.substring(normalized.length - MAX_PROMPT_LENGTH / 2);
    const middleHash = crypto.createHash('md5').update(normalized).digest('hex').substring(0, 8);
    
    return `${firstPart}___${middleHash}___${lastPart}`;
  }
  
  return normalized;
}
```

This approach ensures that:
- Similar prompts with minor differences (capitalization, punctuation, extra spaces) hit the same cache entry
- Very long prompts are truncated but still uniquely identifiable
- The essence of the prompt is preserved for cache key generation

#### Model-Based Cache Invalidation

When a provider's model is updated, relevant cache entries are automatically invalidated:

```typescript
// In LlmFactoryService
updateProviderConfig(type: LlmProviderType, config: Partial<LlmProviderConfig>): boolean {
  const oldModel = provider.getConfig().model;
  const newModel = config.model;
  
  // Update provider configuration
  provider.updateConfig(config);
  
  // If model has changed, invalidate cache for this provider
  if (newModel && oldModel !== newModel) {
    this.logger.log(`Model changed from ${oldModel} to ${newModel}, invalidating cache for provider ${type}`);
    this.invalidateProviderCache(type);
  }
  
  return true;
}
```

This ensures that:
- Cache entries are invalidated when models change, preventing stale responses
- Only affected provider's cache is cleared, preserving other cached responses
- The system maintains consistency between model versions
- In-memory and Redis caches are both properly invalidated

## Testing Strategy

The project utilizes Jest for testing, following standard NestJS patterns:

### 1. Unit Tests (`.spec.ts`)
- Test individual services and providers in isolation.
- Use NestJS testing utilities (`Test.createTestingModule`) to create testing modules.
- Mock dependencies using Jest mocks (`jest.fn()`, `jest.mock()`).
- Focus on testing business logic within services.
- Example: `auth.service.spec.ts`, `users.service.spec.ts`.

### 2. Integration Tests (optional, within `.spec.ts`)
- Test interactions between closely related services or modules.
- Use real dependencies where feasible, mock external boundaries (e.g., database, external APIs).
- Ensure components work together correctly within a module.

### 3. End-to-End (E2E) Tests (`.e2e-spec.ts`)
- Test complete application flows from API endpoints.
- Use `supertest` to make HTTP requests to the running application instance.
- Set up a dedicated testing database (if necessary).
- Test user journeys and authentication flows.
- Example: `auth.e2e-spec.ts`.

### Mocking
- **Repositories**: Use custom providers with mock implementations (e.g., mock `UserRepository`).
- **Services**: Provide mock implementations in the testing module (`providers: [{ provide: ServiceName, useValue: mockService }]`).
- **External APIs**: Mock API clients or use libraries like `nock`.

### Test Execution
- Run tests using `npm run test` (unit tests) and `npm run test:e2e` (E2E tests).
- Utilize Jest's watch mode (`npm run test:watch`) for faster development cycles.

## Authentication & Authorization

- **Strategy:** JWT (JSON Web Tokens) for stateless authentication.
- **Access Tokens:** Short-lived tokens containing user ID, email, and role.
- **Refresh Tokens:** Longer-lived tokens used to obtain new access tokens. *(Details to be documented - see backlog task)*
- **Libraries:** Passport.js with `passport-jwt` and `passport-local` strategies.
- **Guards:** `JwtAuthGuard` protects most endpoints. `LocalAuthGuard` used for login. `RefreshJwtAuthGuard` protects the token refresh endpoint.
- **RBAC:** `RolesGuard` checks `@Roles()` decorator against user role from JWT payload.

## Key Design Patterns

- **Dependency Injection:** Heavily used via NestJS framework.
- **Repository Pattern:** Used by TypeORM for database interaction abstraction.
- **Strategy Pattern:** Used by Passport.js for different authentication methods.
- **Factory Pattern:** Used in `LlmFactoryService` for managing multiple LLM providers.
- **Caching Pattern:** Implemented for LLM responses (In-memory with Redis option).

## Data Flow Examples

- **Login:** User credentials -> `LocalStrategy` -> `AuthService.validateUser` -> `AuthService.login` -> JWT Access & Refresh Tokens.
- **Protected Endpoint Access:** Request with JWT -> `JwtAuthGuard` -> `JwtStrategy` -> Validate token -> Allow access.
- **Token Refresh:** Request with Refresh JWT -> `RefreshJwtAuthGuard` -> `RefreshJwtStrategy` -> Validate token -> `AuthService.refreshToken` -> New Access Token.

## API Documentation Standards

### Swagger/OpenAPI Documentation

The project uses NestJS Swagger integration to provide automatic API documentation. The following standards should be applied to all controllers and DTOs:

#### Controller Documentation

- All controllers should have `@ApiTags('ControllerName')` decorator
- Protected endpoints should have `@ApiBearerAuth()` decorator
- Each endpoint should have:
  - `@ApiOperation({ summary: '...', description: '...' })`
  - `@ApiResponse({ status: xxx, description: '...', schema: { ... } })` for all possible response statuses
  - `@ApiBody({ ... })` for POST/PUT/PATCH endpoints
  - `@ApiParam({ ... })` for endpoints with URL parameters
  - `@ApiQuery({ ... })` for endpoints with query parameters

#### DTO Documentation

- All properties in DTOs should have `@ApiProperty()` or `@ApiPropertyOptional()` decorators
- Enums should be documented using `@ApiProperty({ enum: MyEnum, enumName: 'MyEnum' })`
- Properties should include description and example:
  ```typescript
  @ApiProperty({
    description: 'Description of the property',
    example: 'Example value',
    required: true,
  })
  ```

### Hybrid Response Pattern

The application uses a hybrid response format during the transition from direct DTO responses to a wrapped response format. This pattern ensures backward compatibility while moving towards a more consistent API structure.

#### Response Format Structure

1. **Single Item Response**
```json
{
  // Legacy format (direct properties)
  "id": "123",
  "name": "Example",
  
  // New format (wrapped properties)
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": "123",
    "name": "Example"
  }
}
```

2. **Array Response**
```json
{
  // Legacy format
  "items": [
    { "id": "1", "name": "First" },
    { "id": "2", "name": "Second" }
  ],
  
  // New format
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

3. **Error Response**
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

#### Implementation Requirements

1. **Controller Setup**
```typescript
@UseInterceptors(LegacyResponseInterceptor)
@ApiExtraModels(ResponseWrapper, ...DTOs)
@Controller('resource')
export class ResourceController {
  @Get()
  async find(): Promise<ResponseWrapper<T>> {
    const result = await this.service.find();
    return createHybridResponse(
      result,
      'Operation successful'
    );
  }
}
```

2. **Swagger Documentation**
```typescript
@ApiResponse({
  status: 200,
  description: 'Operation successful.',
  schema: {
    allOf: [
      { $ref: getSchemaPath(ResponseWrapper) },
      {
        properties: {
          data: { $ref: getSchemaPath(ResourceDto) }
        }
      }
    ]
  },
  content: {
    'application/json': {
      examples: {
        legacy: {
          summary: 'Legacy Format',
          value: { /* direct properties */ }
        },
        wrapped: {
          summary: 'Wrapped Format',
          value: { /* wrapped format */ }
        }
      }
    }
  }
})
```

#### Migration Timeline

1. **Current Phase (Q2 2023)**
   - Both formats included in responses
   - No deprecation notices
   - Controllers being updated incrementally

2. **Next Phase (Q3 2023)**
   - Add deprecation notices for direct properties
   - Monitor usage of legacy format
   - Gather feedback on new format

3. **Final Phase (Q4 2023)**
   - Remove legacy format
   - Only wrapped responses
   - Update all documentation
   - Remove transition code

#### Testing Requirements

1. **Response Format Tests**
```typescript
describe('GET /resource', () => {
  it('should return hybrid response', async () => {
    const response = await request(app)
      .get('/resource')
      .expect(200);
    
    // Check legacy format
    expect(response.body.id).toBeDefined();
    expect(response.body.name).toBeDefined();
    
    // Check wrapped format
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.id).toBe(response.body.id);
  });
});
```

2. **Array Response Tests**
```typescript
describe('GET /resources', () => {
  it('should return hybrid array response', async () => {
    const response = await request(app)
      .get('/resources')
      .expect(200);
    
    // Check legacy format
    expect(Array.isArray(response.body.items)).toBe(true);
    
    // Check wrapped format
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.items)).toBe(true);
    expect(typeof response.body.data.total).toBe('number');
  });
});
```

#### Helper Functions

1. **Response Creation**
```typescript
function createHybridResponse<T>(
  data: T,
  message: string = '',
  successOrProps: boolean | Record<string, any> = true
): HybridResponse<T> {
  // Implementation details in response-helper.ts
}
```

2. **Response Type Guards**
```typescript
function isHybridResponse(obj: unknown): obj is HybridResponse {
  return obj !== null 
    && typeof obj === 'object' 
    && 'success' in obj 
    && typeof obj.success === 'boolean';
}
```

#### Best Practices

1. **Response Structure**
   - Keep property names consistent
   - Use clear, descriptive messages
   - Include appropriate metadata
   - Handle errors consistently

2. **Documentation**
   - Document both formats clearly
   - Provide examples for all scenarios
   - Include migration timeline
   - Document breaking changes

3. **Error Handling**
   - Use consistent error codes
   - Provide helpful error messages
   - Include validation details
   - Hide sensitive information

4. **Performance**
   - Minimize response size
   - Use pagination for large datasets
   - Cache when appropriate
   - Optimize data loading

## Supabase Managed Database Pattern

- **Pattern:** Use Supabase as the managed Postgres database for all environments (development, staging, production).
- **Environment Variable:** Set `DATABASE_URL` to the Supabase connection string in `.env.production` or `.env`.
- **No Local Postgres Container:** Do not run a local Postgres container in production; all DB operations use Supabase.
- **Deployment Note:** See `docs/deployment.md` for full setup and backup instructions.
- **Security:** Never commit real Supabase credentials to public repos. Use `.env.example` for variable templates only.
- **Backup:** Use Supabase dashboard or connect via psql/pg_dump to the Supabase DB URL for manual backups.
