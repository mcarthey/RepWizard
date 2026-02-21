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

## Cross-Cutting / Ongoing

- [ ] Keep `CHANGELOG.md` updated at every phase gate
- [ ] Keep `TASKS.md` (this file) updated as tasks are completed
- [ ] Run full test suite before marking any phase complete
- [ ] Apply anti-pattern checklist (`IMPLEMENTATION.md` Section 11) at every phase gate
