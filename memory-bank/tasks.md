## Tasks

### Backend Development (NestJS - `server/`)

**In Progress:**
- [X] Implement Basic Unit/Integration Tests (Auth, CRUD, Assessment, Admin Endpoints)
- [X] Review and Refine API Documentation (Swagger)
  - [X] Create documentation checklist for controller review
  - [X] Review and refine AssessmentController documentation
  - [X] Review and refine AuthController documentation
  - [X] Review and refine SkillsController documentation
  - [X] Review and refine QuestionsController documentation
  - [X] Review and refine UsersController documentation
  - [X] Review and refine RecommendationsController documentation
  - [X] Review and refine AnalyticsController documentation
  - [X] Review and refine MessagingController documentation with focus on microservice patterns
  - [X] Review and refine AppController documentation
  - [X] Standardize response format documentation in systemPatterns.md
  - [X] Document hybrid response pattern in systemPatterns.md
- [ ] Code Review & Refactoring
- [X] Deployment Setup (Dockerfile, etc.)

**Completed:**
- [X] Fix test assertion inconsistency in assessment-standalone.e2e-spec.ts
- [X] Initial Backend Setup (NestJS)
- [X] Database Setup (TypeORM, Entities: User, Skill, Question, AssessmentSession, AssessmentResponse)
- [X] Authentication/Authorization (JWT, Roles Guard)
- [X] CRUD Endpoints (Users, Skills, Questions)
- [X] Assessment Module Logic (Start, Submit, Next Question)
- [X] Basic Unit/Integration Tests (All modules)
- [X] E2E Tests (Auth, CRUD, Assessment, Admin)
- [X] Review and Refine API Documentation (Swagger)
- [X] Fix import errors in assessment controller - Completed
- [X] Deployment Setup (Dockerfile, docker-compose.yml) - Completed

**Pending/Next:**
- [ ] Code Review & Refactoring

**Completed:**
- [X] Setup Initial Project Structure
- [X] Implement Administrative Endpoints (RBAC & Initial Setup)
- [X] Resolve Server Startup Issues (nodemon, EADDRINUSE, paths, etc.)
- [X] Setup Core Database Models - Completed on 2023-03-28
- [X] Implement Authentication System - Completed on 2023-03-28
- [X] Create Assessment Engine - Completed on 2023-03-28
- [X] Implement Recommendation System - Completed on 2023-03-28

**Next Steps:**
- Use `npm run start:tsc-watch` for development
- Accept that clean restarts provide more reliable behavior than partial HMR
- Focus on keeping the codebase modular to minimize restart impact

## Backlog

- [ ] Add AI-powered recommendation generation for mobile app
- [ ] Create admin dashboard for monitoring LLM usage
- [ ] Add unit tests for LLM provider implementations
- [ ] Implement vector database for semantic matching

- Task: Implement E2E Tests for AssessmentController
  - Description: Add E2E tests covering assessment start, submission, and getting the next question.
  - Steps:
    - Create `assessment.e2e-spec.ts` file with basic setup.
    - Add tests for `POST /assessment/start`.
    - Add tests for `POST /assessment/submit`.
    - Add tests for `GET /assessment/:sessionId/next`.
  - Status: COMPLETED

- Task: Implement Unit/E2E Tests for Recommendations Module
  - Description: Add tests for the Recommendations Service and Controller (if applicable).
  - Steps:
    - Add Unit Tests for `RecommendationsService`.
    - Add E2E Tests for `RecommendationsController` (if endpoints exist).
  - Status: PENDING

- [X] 6. CRUD Unit Tests for `UsersService`
  - [X] Setup testing module with mocked `UserRepository`
  - [X] Test `findOneByEmail` method
  - [X] Test `findById` method -> Renamed to `findOne`
  - [X] Test `create` method (incl. password hashing)
  - [X] Test `findAll` method
  - [X] Test `update` method
  - [X] Test `remove` method

- [X] 7. CRUD Unit Tests for `SkillsService`
  - [X] Setup testing module with mocked `SkillsRepository`
  - [X] Test `create` method
  - [X] Test `findAll` method
  - [X] Test `findOne` method
  - [X] Test `update` method
  - [X] Test `remove` method

- [ ] **Questions Module**
  - [X] Define `Question` entity & DTOs
  - [X] Implement `QuestionsService` CRUD
  - [X] Implement `QuestionsController` endpoints
  - [X] Apply RBAC (Admin for create/update/delete)
  - [X] Unit tests for `QuestionsService`
  - [X] E2E tests for `QuestionsController`

- [ ] 8. Admin Endpoints Tests
    - [ ] Unit tests for Admin-specific logic (if any)
    - [ ] E2E tests for Admin-gated endpoints (e.g., user management, bulk operations)

## Project Tasks

### Phase 1: Core Backend Setup (Completed)
- [X] Project Initialization & Basic Structure (NestJS)
- [X] Database Setup (TypeORM, PostgreSQL)
- [X] User Entity & Basic CRUD (UsersService)
- [X] Authentication Setup (Passport.js, JWT)
- [X] UsersController & Endpoints
- [X] Unit Tests for UsersService

### Phase 2: Skills & Questions (Completed)
- [X] Skill Entity & Basic CRUD (SkillsService)
- [X] SkillsController & Endpoints
- [X] Unit Tests for SkillsService
- [X] Question Entity & Relationship with Skills
- [X] QuestionsService CRUD (including skill association)
- [X] QuestionsController & Endpoints
- [X] Unit Tests for QuestionsService

### Phase 3: Assessment Logic (Completed)
- [X] AssessmentSession Entity
- [X] AssessmentResponse Entity
- [X] AssessmentSkillScore Entity
- [X] Implement AssessmentService (startSession, submitAnswer, getNextQuestion, _updateSkillScore)
- [X] Implement AssessmentController & Endpoints
- [X] Refine `getNextQuestion` Response Structure
- [X] Unit Tests for AssessmentService (High-level logic)

### Phase 4: Recommendations (Completed)
- [X] RecommendationResource Entity
- [X] RecommendationHistory Entity
- [X] Implement RecommendationsService (getRecommendations)
- [X] Implement RecommendationsController & Endpoints
- [X] AI Integration Setup (Placeholder/Config)
- [X] Integrate AiRecommendationService call

### Phase 5: API Refinement & Documentation (Completed)
- [X] Add Swagger Documentation to all Controllers
- [X] Refine DTOs with Validation & Swagger Properties
- [X] Review & Standardize Error Handling
- [X] Add Role-Based Access Control (RBAC) Guards

### Phase 6: Testing (Completed - Initial Pass)
- [X] E2E Tests for AuthController
- [X] E2E Tests for UsersController (Admin & User roles)
- [X] E2E Tests for SkillsController (Admin & User roles)
- [X] E2E Tests for QuestionsController (Admin & User roles)
- [X] E2E Tests for AssessmentController
- [X] E2E Tests for RecommendationsController

### Phase 7: Code Review & Refactoring (Completed)
- [X] Review UsersService
- [X] Review SkillsService
- [X] Review QuestionsService
- [X] Review AssessmentService
- [X] Review RecommendationsService
- [X] Apply necessary refactoring based on review

### Phase 8: Integration Testing (Completed - Initial Pass)
- [X] Define Key Integration Test Scenarios
- [X] Setup Integration Test Environment (Jest/Supertest)
- [X] Implement Integration Test for User Signup & Login
- [X] Implement Integration Test for Assessment Flow (Start -> Submit -> GetNext -> Complete)
- [X] Implement Integration Test for Recommendation Generation Flow (Post-Assessment)
- [X] Implement Integration Test for Admin CRUD Operations (Skills, Questions, Users)

### Phase 9: Deployment Preparation (Current)
- [ ] Dockerize Application (Dockerfile, docker-compose.yml)
- [ ] Configure Environment Variables (.env)
- [ ] Setup Database Migrations (Optional/if needed)
- [ ] Define Build Process
- [ ] Consider CI/CD Pipeline Setup

### Known Issues / Future Enhancements (Post-MVP)
- [ ] Refine AI Integration (Error handling, prompt engineering)
- [ ] Enhance Recommendation Logic (More resource options, avoid repetition)
- [ ] Improve Assessment Scoring Model
- [ ] Add More Granular RBAC/Permissions
- [ ] Comprehensive Logging & Monitoring Setup
- [ ] Optimize Database Queries
- [ ] Frontend Application Development

## Current Tasks

### Implement Automated Tests for Auth Module
- **Status:** In Progress
- **Complexity:** 3 (Intermediate Feature)
- **Objective:** Create comprehensive automated tests (unit/E2E) for the AuthModule, covering login, registration, token validation, and refresh token flow.
- **Subtasks (Unit Testing `src/auth/`):**
    - [X] `auth.service.spec.ts`: Setup mocks (JwtService, UsersService, ConfigService)
    - [X] `auth.service.spec.ts`: Test `validateUser` (Success, Failures)
    - [X] `auth.service.spec.ts`: Test `login` (Token generation, return DTO)
    - [X] `auth.service.spec.ts`: Test `register` (Hashing, conflicts)
    - [X] `auth.service.spec.ts`: Test `refreshToken` (Success, Failures)
    - [X] `local.strategy.spec.ts`: Setup mock (AuthService), Test `validate`
    - [X] `jwt.strategy.spec.ts`: Setup mock (ConfigService), Test `validate`
    - [X] `refresh-jwt.strategy.spec.ts`: Setup mock (ConfigService), Test `validate`
- **Subtasks (E2E Testing `test/auth.e2e-spec.ts`):**
    - [X] Setup E2E: `Test.createTestingModule(AppModule)`, DB cleanup logic
    - [X] E2E Test `POST /auth/register` (Success 201, Fail 409, Fail 400)
    - [X] E2E Test `POST /auth/login` (Success 200, Fail 401)
    - [X] E2E Test `POST /auth/refresh` (Success 200, Fail 401 invalid/expired/wrong token type)
    - [X] E2E Test Protected Route Access (Login -> Access, Refresh -> Access, No/Invalid Token -> 401)

### Implement Refresh Token Strategy
- **Status:** Completed
- **Complexity:** 3 (Intermediate Feature)
- **Objective:** Enhance authentication by adding JWT refresh token capability.
- **Subtasks:**
    - [X] Update DTOs (`LoginResponseDto`, `RefreshTokenDto`)
    - [X] Modify `AuthService.login` to return both tokens
    - [X] Create `RefreshJwtStrategy`
    - [X] Update `AuthModule` (register strategy, JWT options)
    - [X] Implement `AuthService.refreshToken`
    - [X] Add `refreshToken` Endpoint to `AuthController`
    - [X] Create `RefreshJwtAuthGuard`
    - [X] Configure Refresh Token Options (`.env`, validation)
    - [X] Review and Test (Manual Plan Created)

## Completed Tasks
- [X] Fix AssessmentController import errors - Completed on 2023-05-21
- [X] Review and Refine API Documentation (Swagger)
- [X] E2E Tests (Auth, CRUD, Assessment, Admin)
- [X] Basic Unit/Integration Tests (All modules)
- [X] Implement Refresh Token Strategy - Completed on 2023-04-06
- [X] Setup Initial Project Structure
- [X] Implement Administrative Endpoints (RBAC & Initial Setup)
- [X] Update deployment documentation and environment configuration to use Supabase as the managed database. Removed references to local Postgres containers. - Completed on 2024-04-14

## Backlog
- [ ] Refactor DTO locations based on agreed convention.
- [ ] Document refresh token flow in `systemPatterns.md`.

## Documentation Reviews

### Completed Tasks
- [x] Review AssessmentController documentation and hybrid response implementation
- [x] Review AuthController documentation and create recommendations
- [x] Review SkillsController documentation with focus on array responses
- [x] Review QuestionsController documentation with focus on sensitive data handling
- [x] Review RecommendationsController documentation with focus on AI/LLM functionality
- [x] Review AnalyticsController documentation with focus on role-based access
- [x] Review MessagingController documentation with focus on microservice patterns
- [x] Create API documentation review checklist
- [x] Update systemPatterns.md with API standards
- [x] Fix test comments in assessment-standalone.e2e-spec.ts

### In Progress
- [ ] Create implementation plan for AuthController updates
- [ ] Design array response handling for SkillsController
- [ ] Draft deprecation notice templates
- [ ] Create message pattern documentation templates

### Planned
- [ ] Create migration guide for client applications
- [ ] Add response format version header
- [ ] Implement response format monitoring

## Implementation Tasks

### Messaging Controller Updates
- [X] Create DTOs for message payloads
  - Created ProcessAssessmentResponseDto
  - Created FinishAssessmentSessionDto
  - Created AssessmentMessageResponseDto and AssessmentSessionResultDto
- [X] Add validation and transformation pipes
  - Added ValidationPipe to message payloads
  - Added class-validator decorators
- [X] Add microservice documentation
  - Added Swagger decorators
  - Added detailed method documentation
  - Added response type documentation
- [X] Update error handling strategy
  - Differentiated between validation/business errors and transient errors
  - Implemented proper message acknowledgment strategy
  - Added structured error responses
- [ ] Add comprehensive tests
- [X] Document message patterns
  - Added detailed JSDoc comments
  - Added Swagger operation descriptions
- [X] Document error scenarios
  - Added error response documentation
  - Added error handling strategy documentation
- [X] Document performance considerations
  - Added message acknowledgment strategy
  - Added retry policy documentation
- [ ] Add monitoring recommendations
- [X] Implement NACK for transient errors
  - Added channel.reject for transient errors
  - Added channel.ack for validation/business errors
- [ ] Configure dead letter queue
- [X] Add message pattern validation
  - Added class-validator decorators
  - Added validation pipes
- [X] Add message pattern examples
  - Added example values in Swagger documentation
- [X] Update error response formats
  - Created standardized error response format
  - Added error codes and details

### Analytics Controller Updates
- [ ] Add LegacyResponseInterceptor
- [ ] Update return types to use ResponseWrapper
- [ ] Implement pagination for assessment lists
- [ ] Update Swagger documentation with both formats
- [ ] Add array response examples
- [ ] Update tests for hybrid format
- [ ] Document role-based access requirements
- [ ] Add role-based access examples
- [ ] Update error response documentation
- [ ] Add role-based access tests

### Recommendations Controller Updates
- [ ] Add LegacyResponseInterceptor
- [ ] Update return types to use ResponseWrapper
- [ ] Implement pagination for array responses
- [ ] Update Swagger documentation with both formats
- [ ] Add array response examples
- [ ] Update tests for hybrid format
- [ ] Standardize AI/LLM response formats
- [ ] Update cache statistics response format
- [ ] Update metrics response format
- [ ] Document AI/LLM error handling
- [ ] Add AI/LLM response examples

### Questions Controller Updates
- [ ] Add LegacyResponseInterceptor and ClassSerializerInterceptor
- [ ] Update return types to use ResponseWrapper
- [ ] Implement pagination for array responses
- [ ] Ensure correctAnswer field is excluded from responses
- [ ] Update Swagger documentation with both formats
- [ ] Add array response examples
- [ ] Update tests to verify sensitive data handling

### Auth Controller Updates
- [ ] Add LegacyResponseInterceptor
- [ ] Update return types to use ResponseWrapper
- [ ] Update Swagger documentation
- [ ] Add response examples
- [ ] Update tests for hybrid format

### Skills Controller Updates
- [ ] Implement array response wrapper
- [ ] Add pagination support
- [ ] Update Swagger documentation for arrays
- [ ] Add array response examples
- [ ] Update array response tests

## Documentation Tasks

### API Standards
- [ ] Document migration timeline
- [ ] Create client migration guide
- [ ] Add deprecation notice templates
- [ ] Document breaking changes
- [ ] Document AI/LLM response formats
- [ ] Document cache statistics format
- [ ] Document metrics response format
- [ ] Document role-based access patterns
- [ ] Document error response formats
- [ ] Document message pattern standards
- [ ] Document RabbitMQ configuration
- [ ] Document error handling strategies
- [ ] Document monitoring requirements

### Testing
- [ ] Update test documentation
- [ ] Add array response test examples
- [ ] Document error response testing
- [ ] Create test coverage checklist
- [ ] Add sensitive data handling test examples
- [ ] Add AI/LLM response test examples
- [ ] Add role-based access test examples
- [ ] Add message pattern test examples
- [ ] Add RabbitMQ integration test examples

## MessagingController Improvements
- [x] Create DTOs for message payloads
- [x] Add validation and documentation
- [x] Improve error handling
- [x] Add comprehensive tests
- [x] Configure dead letter queue
- [x] Add monitoring recommendations

## Monitoring Setup
- [ ] Install and configure Prometheus
- [ ] Set up Grafana dashboard
- [ ] Configure alerting rules
- [ ] Add OpenTelemetry instrumentation
- [ ] Create monitoring documentation

## Documentation
- [ ] Update API documentation with new endpoints
- [ ] Document monitoring setup and configuration
- [ ] Add troubleshooting guide for common issues
- [ ] Create deployment guide with monitoring considerations

## Testing
- [ ] Add integration tests for RabbitMQ communication
- [ ] Add load tests for message processing
- [ ] Add monitoring tests
- [ ] Create test documentation

## Deployment
- [ ] Create deployment scripts
- [ ] Set up CI/CD pipeline
- [ ] Configure production monitoring
- [ ] Create rollback procedures

## Security
- [ ] Review and update security measures
- [ ] Add rate limiting
- [ ] Implement message encryption
- [ ] Add audit logging

## Performance
- [ ] Optimize message processing
- [ ] Implement caching where appropriate
- [ ] Add performance benchmarks
- [ ] Create performance tuning guide