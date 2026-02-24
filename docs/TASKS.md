# RepWizard — Task Tracker

All phases follow the specification in `docs/IMPLEMENTATION.md`. Do not start Phase N+1 until Phase N is complete and all tests pass.

Legend: ✅ Complete | 🔄 In Progress | ⏳ Pending

---

## Phase 1 — Foundation ✅ COMPLETE

> Target: Runnable skeleton with all 8 projects wired up and 88 passing tests.

- [x] Create solution structure with all 8 projects and correct project references (no circular dependencies)
- [x] Implement `BaseEntity` with Id, CreatedAt, UpdatedAt, IsDeleted, SyncState, LastSyncedAt
- [x] Implement all 13 core entities with domain business logic methods
- [x] Implement all enums with `[EnumMember]` and `[Description]` attributes
- [x] Implement `Result<T>` pattern (generic and non-generic)
- [x] Define all repository interfaces (`IRepository<T>`, `IReadRepository<T>`, `IWriteRepository<T>`, domain-specific)
- [x] Define service interfaces (`ISyncService`, `INavigationService`, `IMotionPreferenceService`)
- [x] Implement `ISpecification<T>` + `BaseSpecification<T>` + `SpecificationEvaluator<T>`
- [x] Set up `AppDbContext` with EF Core 9, dual-provider (SQLite/PostgreSQL), global soft-delete filters, audit field automation, sync state tracking
- [x] Implement generic `Repository<T>` and domain-specific repositories (`UserRepository`, `WorkoutSessionRepository`, `ExerciseRepository`)
- [x] Generate and apply initial EF Core migration
- [x] Bootstrap ASP.NET Core API with OpenAPI, Scalar, health check endpoint
- [x] Implement exercise GET endpoints (`GET /api/v1/exercises`, `GET /api/v1/exercises/{id}`)
- [x] Seed exercise library with 35 exercises from `exercises.json` (all categories, research notes included)
- [x] Bootstrap MAUI App with Shell navigation skeleton (all 11 routes registered)
- [x] Implement all 4 core ViewModels (`TodayViewModel`, `ActiveSessionViewModel`, `ProgressViewModel`, `CoachViewModel`) with `BaseViewModel` base class
- [x] Implement all 11 XAML page pairs
- [x] Implement `MetricChipView` reusable control
- [x] Implement `ShellNavigationService` (`INavigationService` implementation)
- [x] Implement `MotionPreferenceService` (platform-specific partial classes for iOS/Android)
- [x] Set up M3E Color System (`Colors.xaml`, `Styles.xaml`)
- [x] Register MediatR in API and MAUI (assembly scanning of `RepWizard.Application`)
- [x] Register FluentValidation via `AddValidatorsFromAssembly`
- [x] Create `Commands/Workouts/` and `Queries/Exercises/` placeholder directories
- [x] Set up `ApiResponse<T>` envelope in `RepWizard.Shared`
- [x] Write 88 unit + integration tests — all passing

**Phase 1 test count: 88 ✅**

---

## Phase 2 — Workout Logging ✅ COMPLETE

> Target: A user can start a session, log a set to SQLite, complete the session, and have it queued for sync.

### 2.1 CQRS Infrastructure

- [x] Add `ValidationBehavior<TRequest, TResponse>` pipeline behavior (`RepWizard.Application/Behaviors/`)
- [x] Register `ValidationBehavior` in `DependencyInjection.cs` and API/MAUI MediatR setup

### 2.2 Exercise Queries

- [x] `GetExercisesQuery` + `GetExercisesQueryHandler` (replaces direct repo call in endpoint)
- [x] `GetExerciseByIdQuery` + `GetExerciseByIdQueryHandler`

### 2.3 Workout Session Commands & Queries

- [x] `StartWorkoutSessionCommand` + handler — creates `WorkoutSession`, writes to SQLite
- [x] `LogSetCommand` + handler — appends `ExerciseSet` to session, writes to SQLite (no API call)
- [x] `CompleteWorkoutSessionCommand` + handler — calls `session.Complete()`, marks session for sync
- [x] `GetWorkoutSessionQuery` + handler — loads session with exercises and sets
- [x] `GetLastSessionDefaultsQuery` + handler — returns previous weight/rep values for progressive overload pre-fill

### 2.4 FluentValidation Validators

- [x] `StartWorkoutSessionCommandValidator` — UserId required, TemplateId optional
- [x] `LogSetCommandValidator` — Reps > 0, WeightKg >= 0, RPE 1–10 if provided, RIR 0–10 if provided
- [x] `CompleteWorkoutSessionCommandValidator` — SessionId required, session must exist

### 2.5 API Endpoints

- [x] Refactor `ExerciseEndpoints` to use `IMediator` instead of direct `IExerciseRepository`
- [x] Add `WorkoutEndpoints` group:
  - [x] `POST /api/v1/workouts/sessions` — start session
  - [x] `PUT /api/v1/workouts/sessions/{id}/log-set` — log a set
  - [x] `POST /api/v1/workouts/sessions/{id}/complete` — complete session
  - [x] `GET /api/v1/workouts/sessions/{id}` — get session detail

### 2.6 MAUI ViewModel Wiring

- [x] Inject `IMediator` into `ActiveSessionViewModel`
- [x] Implement `LogSetAsync` via `LogSetCommand` (offline SQLite write)
- [x] Implement `CompleteSessionAsync` via `CompleteWorkoutSessionCommand` + sync trigger
- [x] Implement `GetLastSessionDefaultsQuery` call on session load for progressive overload defaults
- [x] Inject `IMediator` into `TodayViewModel`
- [x] Implement `LoadAsync` via `GetWorkoutSessionQuery` (load active session or today's scheduled workout)

### 2.7 Sync Service Stub

- [x] Implement `SyncService` in `RepWizard.Infrastructure` (concrete stub for `ISyncService`)
- [x] `HasPendingChangesAsync` — queries SQLite for entities with `SyncState != Synced`
- [x] `SyncAsync` — logs intent, sets `SyncState = Synced` locally (real HTTP push is Phase 5)
- [x] Register `SyncService` in DI

### 2.8 Tests

- [x] `StartWorkoutSessionCommandHandlerTests`
- [x] `LogSetCommandHandlerTests`
- [x] `CompleteWorkoutSessionCommandHandlerTests`
- [x] `GetWorkoutSessionQueryHandlerTests`
- [x] `StartWorkoutSessionCommandValidatorTests`
- [x] `LogSetCommandValidatorTests`
- [x] `ValidationBehaviorTests`

**Phase 2 test count: 123 ✅**

---

## Phase 3 — Progress & History ✅ COMPLETE

> Target: Users can review their workout history, body measurements, and strength charts.

### 3.1 Shared DTOs

- [x] `BodyMeasurementDto`, `LogBodyMeasurementRequest` in `RepWizard.Shared/DTOs/MeasurementDtos.cs`
- [x] `WorkoutHistoryDto` — lightweight DTO for history list items
- [x] `ExercisePRDto` — personal record per exercise (best load, weight, reps, date)
- [x] `ProgressChartDataDto`, `VolumeDataPoint`, `StrengthDataPoint`, `BodyCompositionDataPoint`

### 3.2 Core Interfaces

- [x] `IBodyMeasurementRepository` — `GetForUserAsync`, `GetLatestForUserAsync`
- [x] `IWorkoutSessionRepository` extended with `GetSessionHistoryAsync` (paginated)

### 3.3 Infrastructure

- [x] `BodyMeasurementRepository` — concrete implementation of `IBodyMeasurementRepository`
- [x] `WorkoutSessionRepository` extended with `GetSessionHistoryAsync`
- [x] Both repositories registered in `DependencyInjection.cs`

### 3.4 CQRS Commands & Queries

- [x] `LogBodyMeasurementCommand` + handler + validator (at least one metric required, range validation)
- [x] `GetSessionHistoryQuery` + handler (paginated, completed sessions only)
- [x] `GetMeasurementHistoryQuery` + handler
- [x] `GetProgressChartDataQuery` + handler — weekly volume (Monday-start), strength trends (top 3 exercises by frequency), body composition timeline
- [x] `GetExercisePRQuery` + handler — personal records by total load (weight × reps), optional per-exercise filter

### 3.5 API Endpoints

- [x] `POST /api/v1/measurements` — log new body measurement
- [x] `GET /api/v1/measurements` — measurement history list
- [x] `GET /api/v1/measurements/progress-chart` — chart data aggregate
- [x] `GET /api/v1/workouts/sessions` — paginated session history list
- [x] `GET /api/v1/workouts/prs` — personal records per exercise

### 3.6 Brand Design System Update

- [x] `Colors.xaml` — updated to RepWizard brand palette: Primary `#00C8E8` (cyan), SurfaceColorDark `#0D1117` (deep navy), Tertiary `#64FFDA` (mint-teal), Secondary `#8892B0` (silver-blue), BrandGlow, BrandDeepSpace, BrandChrome, BrandStrength, Outline
- [x] `Styles.xaml` — dark-first M3E: `HeadingLabel`, `SubheadingLabel`, `MetricValueLabel`, `SecondaryButton`, `TonalSurface`, `ElevatedSurface`, `HeroSurface` (cyan stroke)

### 3.7 MAUI ViewModels & Pages

- [x] `ProgressViewModel` — paginated session history via `GetSessionHistoryQuery`, `LoadMoreCommand`, `HasMorePages`
- [x] `SessionDetailViewModel` — new; derives `DurationDisplay`, `VolumeDisplay`, `DateDisplay` from session data
- [x] `MeasurementsViewModel` — new; `SaveMeasurementAsync` → `LogBodyMeasurementCommand`, `IsLoggingForm` toggle
- [x] `ChartsViewModel` — new; parallel load of chart data + PRs via `Task.WhenAll`, derives weekly summary stats
- [x] `ProgressPage.xaml` — full `CollectionView` of `WorkoutHistoryDto`, Load More, Charts/Body nav buttons
- [x] `SessionDetailPage.xaml` — hero summary, nested sets grid with weight/reps/RPE
- [x] `MeasurementsPage.xaml` — latest measurement hero, inline logging form, history list
- [x] `ChartsPage.xaml` — summary metrics, time range selector, PR list, chart placeholder

### 3.8 Tests

- [x] `LogBodyMeasurementCommandHandlerTests` (3 tests)
- [x] `LogBodyMeasurementCommandValidatorTests` (8 tests)
- [x] `GetSessionHistoryQueryHandlerTests` (3 tests)
- [x] `GetProgressChartDataQueryHandlerTests` (3 tests)
- [x] `GetExercisePRQueryHandlerTests` (4 tests)

**Phase 3 test count: 146 ✅**

---

## Phase 3 Gaps — Completed ✅

> These items were partially done or stub-only at Phase 3 completion. Now fully implemented.

- [x] **ActiveSessionPage XAML** — full workout logging UI: exercise picker, set input form (weight/reps/RPE/RIR/SetType), logged sets list, rest timer overlay with countdown, elapsed time, session notes, complete session button
- [x] **ActiveSessionViewModel** — extended with form state, exercise loading via `GetExercisesQuery`, `LogSetFromFormCommand`, progressive overload default pre-fill, `IQueryAttributable` for Shell navigation params, elapsed time timer
- [x] **TodayViewModel wired to real data** — injected `IMediator`, `LoadAsync` queries `GetSessionHistoryQuery` + `GetActiveSessionQuery`, calculates `WorkoutsThisWeek`, `WeeklyProgressPercent`, `MinutesTrainedThisWeek`, `TotalVolumeThisWeek`, `CurrentStreakDays`; `StartWorkoutAsync` sends `StartWorkoutSessionCommand` and navigates with session ID
- [x] **ExerciseLibraryPage** — searchable exercise list with category filter chips, paginated `CollectionView`, tap-to-detail navigation
- [x] **ExerciseLibraryViewModel** — search, category filter, paginated loading via `GetExercisesQuery`, `LoadMoreCommand`
- [x] **ExerciseDetailPage** — full exercise detail view (name, category, equipment, difficulty, description, muscles, instructions, research notes)
- [x] **ExerciseDetailViewModel** — `IQueryAttributable` for exercise ID, loads via `GetExerciseByIdQuery`
- [x] **GetActiveSessionQuery** — new CQRS query + handler for checking active sessions
- [x] **InverseBoolConverter** — added to converters, registered in App.xaml
- [x] DI registration updated for `ExerciseLibraryViewModel`, `ExerciseDetailViewModel`
- [x] Route `coach/library/detail` registered for exercise detail navigation from library

**Post-gap test count: 146 ✅ (no regressions)**

---

## Phase 4 — AI Coach ✅ COMPLETE

> Target: Users can chat with the AI coach and generate a science-validated training program.

- [x] Integrate Anthropic API in `RepWizard.Api` via `AnthropicChatService` (HttpClient-based, streaming SSE)
- [x] Externalize AI system prompt to `appsettings.json` (`AiCoach:SystemPrompt`) — already configured
- [x] `POST /api/v1/ai/chat` — SSE streaming endpoint with context injection
- [x] `AiContextBuilder` service — builds structured user context (profile, workouts, volume landmarks, fatigue indicators)
- [x] `SaveAiMessageCommand` + handler + validator — persists `AiMessage` entities, creates conversations
- [x] `GetConversationQuery` + handler — loads conversation with messages
- [x] `GetConversationsQuery` + handler — lists user's conversations
- [x] `POST /api/v1/ai/generate-program` — stub endpoint (two-phase flow to be refined)
- [x] `ProgramValidator` — enforces MRV limits, deload requirement, CNS load rules, recovery windows, beginner constraints
- [x] Implement `CoachPage` / `CoachViewModel` with streaming chat UI (SSE reading, message bubbles, cancel support)
- [x] Implement `ProgramsPage` / `ProgramsViewModel` with program list (cards, active badge, metadata chips)
- [x] Implement `ProgramDetailPage` / `ProgramDetailViewModel` (week-by-week view, AI reasoning section)
- [ ] Wire generated program into Today tab (scheduled session display) — deferred to Phase 5
- [x] `AiContextBuilderTests` — 6 unit tests with mock user/session data
- [x] `ProgramValidatorTests` — 12 unit tests for every science constraint rule

### Additional Phase 4 deliverables:
- [x] `IAiChatService` interface in Core + `AnthropicChatService` implementation in Infrastructure
- [x] `IAiConversationRepository` + `AiConversationRepository` — conversation persistence with eager-loaded messages
- [x] `ITrainingProgramRepository` + `TrainingProgramRepository` — program persistence with nested weeks/days
- [x] `GetTrainingProgramsQuery` + `GetTrainingProgramByIdQuery` + handlers
- [x] AI DTOs: `AiConversationDto`, `AiConversationDetailDto`, `AiMessageDto`, `SendChatRequest`, `GenerateProgramRequest`
- [x] Program DTOs: `TrainingProgramDto`, `TrainingProgramDetailDto`, `ProgramWeekDto`, `ProgramDayDto`
- [x] `BoolToAlignmentConverter` for chat bubble positioning
- [x] `GET /api/v1/ai/conversations` + `GET /api/v1/ai/conversations/{id}` API endpoints
- [x] DI registration: repositories, `AiContextBuilder`, `AnthropicChatService`, ViewModels

**Phase 4 test count: 164 ✅ (18 new tests, 0 regressions)**

---

## Phase 5 — Polish & Cross-Platform ✅ COMPLETE

> Target: Production-ready, cross-platform, fully synced app.

### 5.1 Authentication

- [x] JWT authentication with PBKDF2 password hashing (`JwtAuthService`)
- [x] `POST /api/v1/auth/register` — register new user, returns JWT + refresh token
- [x] `POST /api/v1/auth/login` — authenticate, returns JWT + refresh token
- [x] `POST /api/v1/auth/refresh` — refresh expired access token
- [x] `RegisterCommand` + handler + validator (name, email, password validation)
- [x] `LoginCommand` + handler + validator
- [x] `RefreshTokenCommand` + handler + validator
- [x] User entity extended with `PasswordHash`, `RefreshToken`, `RefreshTokenExpiresAt`
- [x] JWT middleware configured in API (`UseAuthentication`, `UseAuthorization`)
- [x] JWT settings externalized to `appsettings.json`

### 5.2 Profile Management

- [x] `GET /api/v1/users/{id}` — get user profile
- [x] `PUT /api/v1/users/{id}` — update user profile
- [x] `GetUserProfileQuery` + handler
- [x] `UpdateProfileCommand` + handler + validator (height/weight range validation)
- [x] `SettingsPage` — full profile management UI (edit toggle, fitness goal, experience level, sync status)
- [x] `SettingsViewModel` — profile load/save via MediatR, sync trigger

### 5.3 Sync Service

- [x] Full `SyncService` implementation with real HTTP push/pull via `IHttpClientFactory`
- [x] `POST /api/v1/sync/push` API endpoint — processes client changes, detects conflicts
- [x] `GET /api/v1/sync/pull` API endpoint — returns server changes since timestamp
- [x] Conflict detection: server-wins resolution with local copy preserved
- [x] `ConflictLog` entity + persistence (EntityType, EntityId, LocalJson, ServerJson, Resolution)
- [x] Fallback to local-only sync when API is unreachable
- [x] Conflict resolution UI integrated in SettingsPage (sync status display)

### 5.4 Resilience & Infrastructure

- [x] Polly resilience policies on `HttpClient` (via `Microsoft.Extensions.Http.Resilience` — standard retry + circuit breaker)
- [x] CI/CD pipeline (GitHub Actions) — already configured with build-and-test, MAUI compile check, PR summary
- [ ] Adaptive layouts for tablet and desktop (Windows/macOS) — deferred, requires design specs
- [ ] Notification service — rest timer alerts, scheduled workout reminders — deferred, requires platform-specific implementation
- [ ] App store packaging (Android APK/AAB, iOS IPA) — deferred to release phase

### 5.5 Tests

- [x] `RegisterCommandHandlerTests` (3 tests)
- [x] `LoginCommandHandlerTests` (3 tests)
- [x] `RegisterCommandValidatorTests` (5 tests)
- [x] `UpdateProfileCommandHandlerTests` (3 tests)
- [x] `JwtAuthServiceTests` (8 tests — password hashing, token generation, token validation)
- [x] `AuthEndpointTests` — API integration tests via `WebApplicationFactory` (4 tests)

**Phase 5 test count: 190 ✅ (26 new tests, 0 regressions)**

---

## Hardening Pass ✅ COMPLETE

> Applied after reviewing codebase against global CLAUDE.md standards, `docs/HARDENING.md`, and `docs/TESTING-STRATEGY.md`.

### Security

- [x] Remove JWT secret from `appsettings.json` (committed to source control)
- [x] Move JWT secret to `appsettings.Development.json` (git-ignored in production)
- [x] Fail-fast in `Program.cs` if `Jwt:Secret` is not configured
- [x] Fail-fast in `JwtAuthService` constructor if `Jwt:Secret` is not configured
- [x] Move hardcoded API base URL (`https://localhost:7001`) to `IConfiguration` in `MauiProgram.cs`

### Observability

- [x] Add `GlobalExceptionMiddleware` — catches unhandled exceptions, returns `supportId` for incident triage
- [x] Add `CorrelationIdMiddleware` — propagates `X-Correlation-Id` header, adds to structured log scope

### Test Infrastructure

- [x] Extract `IntegrationTestBase` — shared `WebApplicationFactory` + SQLite in-memory setup
- [x] Refactor `AuthEndpointTests` to inherit from `IntegrationTestBase`

### Performance

- [x] Add `.AsNoTracking()` to all read-only repository queries (6 repositories, 15 methods)
- [x] Skipped write-path methods: `UserRepository.GetByEmailAsync`, `WorkoutSessionRepository.GetActiveSessionForUserAsync`

### Code Quality

- [x] Add `OperationCanceledException` catch before generic `Exception` in `SyncService.SyncAsync`
- [x] Fix CS0618: replace deprecated `MainPage` setter with `CreateWindow` pattern in `App.xaml.cs`
- [x] Fix CS8602: null-forgiving operators on test assertions in `GetExercisePRQueryHandlerTests`
- [x] 0 compiler warnings across all buildable targets

### Reference Docs Added

- [x] `HARDENING.md` — production hardening playbook (moved to global `~/.claude/`)
- [x] `TESTING-STRATEGY.md` — testing patterns and anti-patterns (moved to global `~/.claude/`)

**Post-hardening: 190 tests ✅, 0 warnings, Android build clean**

---

## Code Quality Pass ✅ COMPLETE

> Applied code smell fixes identified by reviewing the codebase against `docs/CODE_SMELLS.md`.

### Magic String Elimination

- [x] Created `RepWizard.Shared/Constants/SyncConstants.cs` — `SyncEntityTypes` and `SyncActions` static classes
- [x] Replaced string literals in `SyncService.cs`, `SyncEndpoints.cs`, `SyncServiceTests.cs` with constants
- [x] Updated `SyncDtos.cs` comment to reference `SyncActions` constants

### SSE Parsing Deduplication

- [x] Created `RepWizard.Shared/Helpers/SseParser.cs` — `TryParseDataLine` shared helper
- [x] Replaced inline SSE parsing in `AnthropicChatService.cs` and `CoachViewModel.cs`

### Silent Exception Swallowing

- [x] `JwtAuthService`: added `ILogger`, replaced bare `catch` with `SecurityTokenExpiredException` + `Exception` catches with logging
- [x] `AnthropicChatService`: added `ILogger`, changed `catch (JsonException)` to log with `LogDebug`
- [x] `CoachViewModel`: changed `catch (JsonException)` to log via `Debug.WriteLine`

### GlobalExceptionMiddleware Environment Awareness

- [x] Added `IHostEnvironment` injection — Development returns actual exception details, Production returns generic message
- [x] Updated `MiddlewareTests` assertions to match Development-mode behavior

### Documentation

- [x] Expanded `docs/CODE_SMELLS.md` with MAUI ViewModel variant, middleware exception hiding, sync layer magic strings, convention vs. speculation distinction, and new "Framework Assumption Mismatch" section (EF Core sentinel check, AsNoTracking)

**Post-quality pass: 227 tests ✅, 0 warnings**

---

## Test Gap Closure ✅ COMPLETE

> Closed gaps identified in `docs/TEST-GAP-PLAN.md` against `docs/TESTING-STRATEGY.md`. Added 36 tests across 5 new files + 1 extended file.

### Phase 1: Auth Integration Tests (+5 tests)

- [x] `Register_DuplicateEmail_ReturnsBadRequest` — second registration with same email → 400
- [x] `Login_ValidCredentials_ReturnsOkWithTokens` — register then login, verify tokens + email match
- [x] `Refresh_ValidToken_ReturnsNewTokens` — register, refresh with valid tokens → 200
- [x] `Refresh_InvalidToken_ReturnsUnauthorized` — fake tokens → 401
- [x] `Register_MissingPassword_ReturnsBadRequest` — empty password → 400
- [x] `ProtectedEndpoint_NoToken_ReturnsUnauthorized` — added after BUG-1 fix
- [x] `RegisterAndGetAuth()` helper added to `AuthEndpointTests`
- [x] `RegisterTestUser()` helper added to `IntegrationTestBase` for cross-class reuse
- [x] `Factory` accessor exposed on `IntegrationTestBase` for test data seeding

**Post-Phase 1: 195 tests ✅**

### Phase 2: Core Endpoint Integration Tests (+18 tests)

**ExerciseEndpointTests (5 tests):**
- [x] `GetExercises_ReturnsOkWithPaginatedList`
- [x] `GetExercises_WithSearch_FiltersResults`
- [x] `GetExercises_WithCategoryFilter_FiltersResults`
- [x] `GetExerciseById_ExistingId_ReturnsExercise`
- [x] `GetExerciseById_NonExistentId_ReturnsNotFound`

**WorkoutEndpointTests (8 tests):**
- [x] `StartSession_ValidRequest_ReturnsCreated`
- [x] `StartSession_EmptyUserId_ReturnsBadRequest`
- [x] `GetSession_ExistingId_ReturnsSessionDetail`
- [x] `GetSession_NonExistentId_ReturnsNotFound`
- [x] `LogSet_ValidRequest_ReturnsOk`
- [x] `LogSet_InvalidReps_ReturnsBadRequest`
- [x] `CompleteSession_ActiveSession_ReturnsOk`
- [x] `GetSessionHistory_ReturnsOkWithPagination` (see Known Bugs: cannot verify completed session appears in history)

**MeasurementEndpointTests (5 tests):**
- [x] `LogMeasurement_ValidRequest_ReturnsCreated`
- [x] `LogMeasurement_NoMetrics_ReturnsBadRequest`
- [x] `GetMeasurementHistory_ReturnsList`
- [x] `GetMeasurementHistory_WithLimit_RespectsLimit`
- [x] `GetProgressChart_ReturnsChartData`

**Post-Phase 2: 213 tests ✅**

### Phase 3: Middleware Integration Tests (+5 tests)

**MiddlewareTests (3 tests):**
- [x] `Request_WithoutCorrelationId_GeneratesAndReturnsOne`
- [x] `Request_WithCorrelationId_EchoesItBack`
- [x] `MultipleRequests_GetDifferentCorrelationIds`

**GlobalExceptionMiddlewareTests (2 tests):**
- [x] `UnhandledException_Returns500WithSupportId` — verifies `{ success, error, supportId }` shape
- [x] `UnhandledException_IncludesCorrelationIdInResponse` — correlation ID survives exception path
- [x] Uses `IStartupFilter` to inject `/test/throw` endpoint into existing pipeline

**Post-Phase 3: 218 tests ✅**

### Phase 4: SyncService Unit Tests (+8 tests)

- [x] `HasPendingChanges_NoPendingSessions_ReturnsFalse`
- [x] `HasPendingChanges_NewSession_ReturnsTrue`
- [x] `SyncAsync_PendingSessions_PushesAndReturnsCounts`
- [x] `SyncAsync_NoPendingSessions_SkipsPush`
- [x] `SyncAsync_ServerReturnsConflict_MarksSessionAsConflict`
- [x] `SyncAsync_ApiUnreachable_FallsBackToLocalSync`
- [x] `SyncAsync_Cancelled_ReturnsCancelledResult`
- [x] `SyncAsync_UnexpectedException_ReturnsFailure`
- [x] Uses `MockHttpMessageHandler` + real SQLite in-memory `AppDbContext`
- [x] `ChangeTracker.Clear()` after seeding to avoid circular reference during serialization

**Post-Phase 4: 226 tests ✅**

### Test Ratio Improvement

| Metric | Before | After |
|--------|--------|-------|
| Total tests | 190 | 227 |
| Unit tests | ~162 (85%) | ~162 (71%) |
| Integration tests | ~25 (13%) | ~62 (27%) |
| E2E / Smoke | ~3 (2%) | ~3 (1%) |

Ratio is now closer to the 60/30/10 target from `docs/TESTING-STRATEGY.md`.

---

## Known Bugs — Fixed

> These bugs were discovered during test gap closure and have been fixed.

### BUG-1: No endpoints enforced auth ✅ FIXED

**Fix applied:** Added `.RequireAuthorization()` to Users, Workouts, Measurements, AI, and Sync endpoint groups. Auth, Health, and Exercises remain anonymous. Updated `IntegrationTestBase.RegisterTestUser()` to set Bearer token on `Client`. Added `ProtectedEndpoint_NoToken_ReturnsUnauthorized` test.

**Files changed:** `UserEndpoints.cs`, `WorkoutEndpoints.cs`, `MeasurementEndpoints.cs`, `AiEndpoints.cs`, `SyncEndpoints.cs`, `IntegrationTestBase.cs`, `AuthEndpointTests.cs`, `WorkoutEndpointTests.cs`

### BUG-2: `AsNoTracking` + client-generated Guids caused silent write failures ✅ FIXED

**Root cause:** Two interacting issues:
1. `GetWithExercisesAndSetsAsync()` used `.AsNoTracking()`, returning detached entities. Both `CompleteWorkoutSessionCommandHandler` and `LogSetCommandHandler` modified the detached graph and called `SaveChangesAsync()` — which persisted nothing.
2. EF Core's sentinel check: entities with client-generated `Guid` IDs already have non-default values. When re-attached via `Update()`, EF sees a non-default PK and marks child entities as `Modified` (not `Added`), causing `DbUpdateConcurrencyException` for genuinely new records.

**Fix applied (proper):**
- Added `MarkAsNew()` extension method on `BaseEntity` — resets `Id` to `Guid.Empty` so EF treats the entity as `Added` when attached
- `LogSetCommandHandler`: calls `MarkAsNew()` on new `SessionExercise` and `ExerciseSet` before adding to the context
- Removed the intermediate `AddSessionExerciseAsync` / `AddExerciseSetAsync` workaround
- `CompleteWorkoutSessionCommandHandler`: uses `_sessions.Update(session)` to re-attach the detached entity
- `GetWithExercisesAndSetsAsync` retains `AsNoTracking()` (used by read-only `GetWorkoutSessionQueryHandler`)
- Strengthened `GetSessionHistory_ReturnsCompletedSessions` test to verify completed sessions appear in history

**Files changed:** `BaseEntity.cs` (MarkAsNew), `LogSetCommandHandler.cs`, `CompleteWorkoutSessionCommandHandler.cs`, `WorkoutEndpointTests.cs`

### BUG-3: Circular reference in SyncService serialization ✅ FIXED

**Fix applied:** Added `JsonSerializerOptions { ReferenceHandler = ReferenceHandler.IgnoreCycles }` to `SyncService.PushChangesAsync` and all `JsonSerializer.Serialize` calls in `SyncEndpoints.cs` that serialize entity objects with navigation properties.

**Files changed:** `SyncService.cs`, `SyncEndpoints.cs`

---

## Deferred Items

> These items were intentionally deferred. Each requires either design decisions, platform-specific work, or is release-phase scope.

- [ ] Adaptive layouts for tablet and desktop (Windows/macOS) — requires design specs
- [ ] Notification service — rest timer alerts, scheduled workout reminders — requires platform-specific implementation
- [ ] App store packaging (Android APK/AAB, iOS IPA) — release phase
- [x] Wire generated AI program into Today tab (scheduled session display)
- [x] EF Core migrations — InitialCreate + AddInputConstraints, provider-aware initialization
- [x] Rate limiting on API endpoints — 3 policies (auth: 5/min, ai: 10/min, fixed: 60/min)
- [ ] Contract testing between MAUI client and API
- [x] Input validation at database level — MaxLength on 12 string fields, 13 SQL Server check constraints
- [x] `CHANGELOG.md` — created and maintained through all phases
- [x] Theme alignment — SVG tab/metric icons, app icon from logo, color palette verified
- [ ] SkiaSharp hero progress arc on TodayPage (spec calls for gradient stroke + glow)
- [ ] Motion system — breathing scale animation, morph transitions, celebration sequences (Section 13.7–13.8)

---

## Dev Tooling ✅ COMPLETE

- [x] Created `RepWizard.Dev.slnf` — development solution filter (includes UI, excludes App host to avoid MAUI multi-targeting errors on Windows)
- [x] Created `.vscode/tasks.json` — Build (Dev filter), Test, Build Android, MAUI emulator tasks, Run API, compound tasks
- [x] Three solution filters: `RepWizard.CI.slnf` (no MAUI), `RepWizard.Dev.slnf` (with UI), `RepWizard.sln` (all 8 projects)

---

## Plan Tab Redesign ✅ COMPLETE

> Reframes the Coach tab as a program builder studio. AI is an embedded advisor, not the landing page.
> Spec: `docs/RepWizard-PlanTab-Spec.md`

### Commit 1: Rename + Hub Shell + Goals ✅ COMPLETE

- [x] Extend `User` entity with 8 training goal fields (LongTermGoalText, LongTermGoalMonths, ShortTermFocusText, ShortTermFocusWeeks, AvailableDaysPerWeek, SessionLengthMinutes, AvailableEquipment, MovementLimitations)
- [x] Update `UserDto`, `UpdateProfileRequest`, `UpdateProfileCommand`, handler, query handlers
- [x] Update `AppDbContext` with MaxLength constraints for new string fields
- [x] Update `AiContextBuilder` to include goal fields in AI context
- [x] Create `PlanHubPage` + `PlanHubViewModel` — hub page with active program card, goals strip, quick actions
- [x] Create `GoalsPage` + `GoalsViewModel` — goals editor for all 8 goal fields
- [x] Create `AiChatPage` + `AiChatViewModel` — renamed from CoachPage/CoachViewModel, simplified header, IQueryAttributable for source context
- [x] Create `ChatMessageItem` as standalone file (extracted from CoachViewModel)
- [x] Create `IsNotNullConverter` for goals strip visibility
- [x] Update `AppShell` — Coach tab → Plan tab (PlanHubPage as root)
- [x] Register new routes: `goals`, `ai-chat`
- [x] Update `ViewModelRegistration` — replace Coach with PlanHub, Goals, AiChat
- [x] Update `ProgramsViewModel` — NavigateToCoach → NavigateToAiChat
- [x] Update `ProgramsPage` — button text and command references
- [x] Generate EF migration `AddUserGoalFields`
- [x] Delete old Coach files (CoachPage.xaml, CoachPage.xaml.cs, CoachViewModel.cs)
- [x] Add 3 new tests: goal field save/load, goal field defaults, AI context includes goals
- [x] Copy `tab_coach.svg` → `tab_plan.svg` for tab icon

**Post-Commit 1 test count: 246 ✅ (3 new tests, 0 regressions)**

### Commit 2: Builder Flow + Quick-Start Templates ✅ COMPLETE

- [x] Create `ProgramBuilderPage` + `ProgramBuilderViewModel` (5-step wizard: Goal, Structure, Exercises, Volume, Review)
- [x] Create `QuickStartTemplates` static data service (5 curated templates)
- [x] Create `CreateTrainingProgramCommand` + handler + validator
- [x] Create `ActivateProgramCommand` + handler
- [x] Add quick-start template cards to PlanHubPage
- [x] Implement `generate-program` endpoint (replace stub with real SSE + AI context)
- [x] Add `POST /api/v1/programs` + `POST /api/v1/programs/{id}/activate` endpoints
- [x] Add `DeactivateAllForUserAsync` to `ITrainingProgramRepository`
- [x] Add `StepColorConverter`, `EqualConverter` for builder step UI
- [x] 18 new tests (QuickStartTemplates, CreateTrainingProgram, ActivateProgram, validator)

**Post-Commit 2 test count: 264 ✅ (18 new tests, 0 regressions)**

### Commit 3: AI Integration ✅ COMPLETE

- [x] Add AI Insight banner to PlanHubPage (lazy-loaded, shimmer animation while loading)
- [x] Create `GetPlanInsightQuery` + handler (AiContextBuilder + IAiChatService, graceful failure)
- [x] Create `GetGoalAnalysisQuery` + handler (AiContextBuilder + IAiChatService, graceful failure)
- [x] Add goal analysis card on GoalsPage (loads after save)
- [x] Add client-side advisory text in builder (deterministic rules, offline-capable)
- [x] 8 new tests (GetPlanInsightQueryHandler: 4, GetGoalAnalysisQueryHandler: 4)

**Post-Commit 3 test count: 272 ✅ (8 new tests, 0 regressions)**

---

## Cross-Cutting / Ongoing

- [x] Keep `CHANGELOG.md` updated at every phase gate
- [x] Keep `TASKS.md` (this file) updated as tasks are completed
- [x] Run full test suite before marking any phase complete
- [x] Apply anti-pattern checklist (`IMPLEMENTATION.md` Section 11) at every phase gate
