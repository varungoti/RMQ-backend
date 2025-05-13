# Technical Context: Learner Insights

## 1. Technology Stack (Proposed)

*   **Frontend (Mobile):** React Native (using TypeScript)
    *   *Rationale:* Cross-platform development efficiency, large community, leverages existing React knowledge.
    *   *Key Libraries:* Expo (for streamlined development/builds), React Navigation, Zustand (state management), TanStack Query (data fetching), Recharts (or similar for in-app charts).
*   **Frontend (Web Portal - Admin/School):** Next.js (using TypeScript)
    *   *Rationale:* Excellent developer experience, SSR/SSG capabilities, routing, strong ecosystem.
    *   *Key Libraries:* React, Tailwind CSS, Shadcn UI (or similar component library), Zustand, TanStack Query, Recharts.
*   **Backend API:** Node.js with TypeScript (using Express or NestJS)
    *   *Rationale:* JavaScript ecosystem alignment with frontend, performance, large package availability.
    *   *Key Libraries:* Express/NestJS, Prisma (or TypeORM) for database interaction, Zod (validation), Passport.js (authentication).
*   **Database:** Supabase (managed Postgres)
    *   *Rationale:* Fully managed, Postgres-compatible, scalable, and provides built-in authentication and dashboard tools.
    *   *Connection:* Use the Supabase-provided DATABASE_URL (see deployment guide for details).
    *   *Environment Variable Example:*
        DATABASE_URL=postgresql://postgres:IELTSguru%4011a@db.msjzaofoazznvcdsjeby.supabase.co:5432/postgres
    *   *Reference:* See `docs/deployment.md` for setup and backup instructions.
*   **Charting:** Recharts (Client-side rendering in apps)
    *   *Rationale:* Popular, composable charting library for React/React Native.
*   **AI Integration:** Multiple LLM providers for AI-powered recommendations.
*   **Deployment/Hosting:** Cloud Platform (AWS/GCP/Azure - specific services TBD, e.g., EC2/ECS/Lambda for backend, S3 for static assets, RDS for database).
*   **Video Hosting:** Vimeo or Wistia (for secure, performant course video streaming).

## 2. Development Environment & Tools

*   **IDE:** Cursor
*   **Hot Module Replacement (HMR):** To be configured for NestJS server (`webpack-hmr`).
*   **Version Control:** Git (using GitHub/GitLab/Bitbucket)
*   **Package Managers:** npm / yarn / pnpm
*   **OS:** Development expected on Windows, macOS, Linux (platform awareness required).
*   **Communication:** Slack/Discord/Teams (TBD)
*   **Project Management:** Jira/Trello/Asana (TBD)

## 3. Technical Constraints & Considerations

*   **Scalability:** Architecture must support a growing user base and potentially large question/course content.
*   **Security:** Robust authentication, authorization, and data protection (especially student data privacy - GDPR/COPPA compliance if applicable).
*   **Performance:** Adaptive testing requires low latency. Report generation should be efficient. Course streaming must be smooth.
*   **Maintainability:** Clean code, modular design, good documentation (Memory Bank!), and automated testing are crucial.
*   **Accessibility:** UI/UX design must adhere to accessibility standards (WCAG).
*   **Content Management:** Need an efficient workflow for SMEs and content creators to manage the large question bank and course materials.
*   **Psychometric Rigor:** The validity and reliability of the assessment are paramount. Technical implementation must support psychometric requirements (e.g., data for IRT calibration).

## 4. LLM Technologies

The application now incorporates several Language Learning Model (LLM) providers:

1. **Google Gemini**
   - Default provider in our system
   - Using Gemini 2.5 Pro model
   - Excellent handling of educational content
   - Latest version (2.5) has improved context window and instruction following
   - Integration via Google's generativelanguage API

2. **OpenAI GPT**
   - Supports GPT-3.5-Turbo and GPT-4 models
   - Strong general-purpose model
   - Integration via standard OpenAI API
   
3. **Anthropic Claude**
   - Known for better instruction following and reduced hallucination
   - Options include Claude 3 Haiku (fast), Sonnet (balanced), Opus (powerful)
   - Integration via Anthropic Messages API
   
4. **Cohere**
   - Specialized for educational content
   - Command model used as default
   - Integration via Cohere Chat API
   
### LLM Integration Details

The system uses an abstract provider pattern with these components:

- **LlmProviderService**: Abstract base class defining the common interface
- **Multiple Provider Implementations**: Concrete implementations for each LLM service
- **LlmFactoryService**: Factory pattern service for provider creation and management
- **Hybrid Recommendation Approach**: Combines rule-based and AI-powered recommendations

### Usage Patterns

1. **Content Generation**: Creating personalized explanations for skill gaps
2. **Recommendation Generation**: Suggesting learning resources based on skill gaps
3. **Feedback Analysis**: Evaluating student responses (planned)
4. **Content Adaptation**: Adapting learning materials to student level (planned)

### API Considerations

- **Rate Limiting**: Most LLM providers have rate limits
  - OpenAI: Varies by tier, typically 60-3000 RPM
  - Google Gemini: 60 queries per minute (QPM)
  - Anthropic: Varies by tier
  - Cohere: 100 requests per minute
  
- **Costs**: Pay-per-token model
  - Google Gemini: $0.0007/1K input tokens, $0.0014/1K output tokens
  - OpenAI GPT-3.5: $0.0015/1K input tokens, $0.002/1K output tokens
  - Anthropic Claude: $0.003-0.015/1K input tokens, $0.015-0.075/1K output tokens
  - Cohere: $0.0015/1K input tokens, $0.0015/1K output tokens
  
- **Response Times**:
  - Google Gemini: 0.5-2s
  - OpenAI: 1-3s
  - Anthropic: 1-4s
  - Cohere: 1-2s
  
### Environment Configuration

All LLM providers are configured via environment variables to make deployment easier:

```
# Default provider selection
DEFAULT_LLM_PROVIDER=gemini

# Enable/disable specific providers
USE_GEMINI=true
USE_OPENAI=false
USE_ANTHROPIC=false
USE_COHERE=false

# API keys and model selection for each provider
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-pro

OPENAI_API_KEY=
OPENAI_MODEL=gpt-3.5-turbo

ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-3-haiku-20240307

COHERE_API_KEY=
COHERE_MODEL=command 

## Redis Integration

For higher-performance caching with persistence, the application supports Redis:

### Redis Configuration

```
# Redis Cache Configuration
REDIS_CACHE_ENABLED=true          # Set to true to enable Redis cache
REDIS_HOST=localhost              # Redis server hostname
REDIS_PORT=6379                   # Redis server port
REDIS_PASSWORD=password123        # Redis password (if required)
REDIS_CACHE_TTL_SECONDS=86400     # Cache TTL in seconds (24 hours)
REDIS_CACHE_MAX_ITEMS=10000       # Maximum items in cache
```

### Redis Setup Instructions

1. **Local Development:**
   ```bash
   # Install Redis on your local machine
   # Windows: Use WSL or Docker
   # macOS: brew install redis
   # Ubuntu: sudo apt install redis-server
   
   # Start Redis server
   redis-server
   ```

2. **Docker Deployment:**
   ```yaml
   # docker-compose.yml snippet
   services:
     redis:
       image: redis:alpine
       ports:
         - "6379:6379"
       volumes:
         - redis-data:/data
       command: redis-server --appendonly yes
   
   volumes:
     redis-data:
   ```

3. **Production Deployment:**
   - Consider using a managed Redis service like Redis Labs, AWS ElastiCache, or Azure Cache for Redis
   - Configure connection string in environment variables
   - Enable SSL for secure connections
   - Set up proper authentication

### Fallback Mechanism

The system automatically falls back to in-memory caching if:
- Redis is disabled (`REDIS_CACHE_ENABLED=false`)
- Redis connection fails
- Redis operations throw exceptions

This ensures the application continues to function even if Redis is unavailable. 

## Development Setup

- **Node.js Version:** v20.16.0
- **Package Manager:** pnpm 9.7.0
- **Operating System:** win32 10.0.26100
- **Database:** PostgreSQL (local or containerized recommended for dev)
- **Testing:** Jest - Used for both unit testing (`pnpm test`) and E2E testing (`pnpm test:e2e`) within the NestJS framework. Requires configuration for mocking dependencies (unit tests) and potentially managing database state (E2E tests).

## Technical Constraints & Notes

- Requires PostgreSQL database connection defined in `.env`.
- Eager loading is generally avoided; relations loaded explicitly where needed.
- **Known Issue:** Jest test runner (`pnpm test`/`pnpm test:e2e`) sometimes fails to provide output or exit cleanly in the current dev environment (Windows/Terminal?). Running with `--detectOpenHandles` was inconclusive due to interruptions. Requires further investigation. 

## Technologies Used

### Backend
- **NestJS**: Main framework for the server application
- **TypeORM**: ORM for database interactions
- **PostgreSQL**: Primary database
- **JWT**: Authentication mechanism
- **Swagger/OpenAPI**: API documentation
- **Class-validator**: Input validation
- **Class-transformer**: Object transformation

### Testing
- **Jest**: Testing framework
- **Supertest**: HTTP testing

## Development Setup

### Environment
- Node.js environment
- PNPM for package management
- Local PostgreSQL instance required
- Environment variables for configuration

### Build & Run
- PNPM scripts defined for various operations
- Development mode: `pnpm dev`
- Testing: `pnpm test` and `pnpm test:e2e`

## Technical Constraints

### Architecture
- Monorepo structure with server and future client folders
- RESTful API design principles
- DTO pattern for input/output validation
- Repository pattern for data access

### Security
- JWT tokens for authentication
- Role-based authorization
- Input validation on all endpoints

## Dependencies

### Backend Dependencies
- NestJS core modules (@nestjs/common, @nestjs/core)
- TypeORM and related modules
- Validation and transformation libraries
- Swagger modules for API documentation

## API Design

### Response Format Standardization
- New standardized response format implemented using `ResponseWrapper` class
- All API responses follow the format:
  ```typescript
  {
    success: boolean;
    data: T | null;
    message?: string;
  }
  ```
- Global exception filter handles errors and formats them consistently
- HTTP status codes used appropriately alongside the response format
- DTO transformation ensures proper data formatting

### API Versioning
- Currently using implicit versioning through endpoint design
- Future consideration for explicit versioning through URLs or headers 

### DTO Location Convention

The project follows a standardized approach to DTO organization and location:

1. **Module-Specific DTOs**
   - Location: `src/dto/{module-name}.dto.ts`
   - Contains all DTOs related to a specific module
   - Example: `src/dto/assessment.dto.ts` for assessment-related DTOs

2. **Shared/Common DTOs**
   - Location: `src/dto/common/`
   - Contains DTOs used across multiple modules
   - Example: `src/dto/common/pagination.dto.ts`

3. **Naming Conventions**
   - Create DTOs: `Create{Entity}Dto`
   - Update DTOs: `Update{Entity}Dto`
   - Response DTOs: `{Entity}ResponseDto`
   - Query DTOs: `{Entity}QueryDto`
   - Base DTOs: `{Entity}BaseDto`

4. **Import Pattern**
   ```typescript
   // For module-specific DTOs
   import { CreateUserDto } from '../dto/user.dto';
   
   // For shared DTOs
   import { PaginationDto } from '../dto/common/pagination.dto';
   ```

5. **DTO Organization**
   - Group related DTOs in the same file
   - Use inheritance for common properties
   - Export all DTOs that need to be used outside the file
   - Use `@ApiProperty()` decorators for Swagger documentation

6. **Validation**
   - Use class-validator decorators for input validation
   - Use class-transformer for object transformation
   - Apply ValidationPipe at controller level

7. **Documentation**
   - All DTOs must have `@ApiProperty()` decorators
   - Include descriptions and examples
   - Document required vs optional properties
   - Use proper types and formats

This convention ensures consistency across the codebase and makes it easier to locate and maintain DTOs. 