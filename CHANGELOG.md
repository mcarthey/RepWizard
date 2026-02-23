# RepWizard Changelog

All notable changes to this project are documented here.

---

## Phase 1 — Foundation (2026-02-20)

### Added

#### Solution Structure
- Created 8-project .NET 9 solution following Clean Architecture (Onion pattern)
- Project dependency graph enforces no circular dependencies:
  - `RepWizard.Core` → no outbound dependencies
  - `RepWizard.Shared` → no outbound dependencies
  - `RepWizard.Application` → Core, Shared
  - `RepWizard.Infrastructure` → Core, Shared, Application
  - `RepWizard.Api` → Application, Infrastructure, Shared
  - `RepWizard.Tests` → Core, Application, Infrastructure, Shared
  - `RepWizard.App` (MAUI) → UI, Application, Infrastructure, Shared
  - `RepWizard.UI` (MAUI) → Application, Core, Shared

#### Domain Model (`RepWizard.Core`)
- `BaseEntity` — Id (Guid), CreatedAt, UpdatedAt, IsDeleted, SyncState, LastSyncedAt
- **13 Core Entities:**
  - `User` — profile, fitness goal, experience level; `CalculateAge()`, `GetGoalDescription()`
  - `Exercise` — library entry with muscles, equipment, instructions; `IsHighCnsDemand()`
  - `WorkoutTemplate` — reusable workout plan; `GetTotalSetCount()`, `GetTargetedMuscles()`
  - `TemplateExercise` — junction with rep range, progression rule; `IsRepRangeValid()`
  - `WorkoutSession` — a completed/active session; `Complete()`, `GetTotalVolume()`, `GetDuration()`
  - `SessionExercise` — exercise within session; `GetBestSet()`, `GetTotalVolume()`
  - `ExerciseSet` — individual set with weight, reps, RPE, RIR; `EstimateRpeFromRir()`
  - `TrainingProgram` — multi-week plan; `Activate()`, `Deactivate()`, `HasRequiredDeloadWeek()`
  - `ProgramWeek` — weekly block; `IsVolumeMultiplierValid()`, `GetTrainingDayCount()`
  - `ProgramDay` — daily assignment or rest day
  - `BodyMeasurement` — body composition snapshot; `CalculateLeanBodyMass()`, `CalculateFatMass()`
  - `AiConversation` — AI chat thread; `GetTotalTokensUsed()`
  - `AiMessage` — individual message with role, content, token count

- **7 Core Enumerations** (all with `[EnumMember]` and `[Description]` attributes):
  - `FitnessGoal` (7 values), `ExperienceLevel` (5), `ExerciseCategory` (8), `Equipment` (9)
  - `SetType` (7), `ProgressionRule` (6), `MuscleGroup` (14), `SyncState` (4)
  - Plus `MessageRole`, `DayOfWeekEnum`, `Difficulty`

- **`Result<T>` pattern** — explicit success/failure discrimination, no exception-driven control flow
- **Repository interfaces** — `IReadRepository<T>`, `IWriteRepository<T>`, `IRepository<T>`
- **Specific interfaces** — `IUserRepository`, `IWorkoutSessionRepository`, `IExerciseRepository`
- **Service interfaces** — `ISyncService`, `INavigationService`, `IMotionPreferenceService`
- **`ISpecification<T>`** — specification pattern for complex query composition

#### Infrastructure (`RepWizard.Infrastructure`)
- `AppDbContext` — EF Core 9 DbContext with:
  - Supports both SQLite (MAUI client) and PostgreSQL (API server) via provider configuration
  - Global soft-delete query filters on all entities
  - JSON serialization for collection properties (MuscleGroup lists, string lists)
  - `SaveChangesAsync` override that automatically updates `CreatedAt`/`UpdatedAt` audit fields
  - Sync state tracking (auto-marks as `Modified` on update)
- `Repository<T>` — generic EF Core repository implementation
- `UserRepository`, `WorkoutSessionRepository`, `ExerciseRepository` — domain-specific implementations
- `BaseSpecification<T>`, `SpecificationEvaluator<T>` — specification pattern implementation
- `DependencyInjection` — registration helpers for PostgreSQL, SQLite, and test configurations
- `ExerciseSeeder` — seeds exercise library from `exercises.json` seed file

#### API (`RepWizard.Api`)
- ASP.NET Core 9 Minimal API host
- OpenAPI documentation via `Microsoft.AspNetCore.OpenApi`
- Scalar API browser at `/scalar` in development
- Health check endpoint: `GET /health`
- Exercise endpoints: `GET /api/v1/exercises` (paginated, filtered), `GET /api/v1/exercises/{id}`
- `ApiResponse<T>` envelope — all endpoints return consistent `{success, data, message, errors, pagination}`
- AI Coach system prompt externalized to `appsettings.json` (version-controlled, no hardcoding)

#### MAUI Client (`RepWizard.App` + `RepWizard.UI`)
- Shell navigation skeleton with 3 tabs: Today, Progress, Coach
- All 11 routes registered: `today/active-session`, `today/exercise-detail`, `progress/session`, `progress/charts`, `progress/measurements`, `coach/programs`, `coach/program`, `coach/library`, `settings`
- `MauiProgram.cs` — DI wiring with SQLite offline-first setup, HttpClient factory (no raw HttpClient)
- **ViewModels** (all inherit `BaseViewModel` with `IsLoading`, `HasError`, `ErrorMessage`, `IsEmpty`):
  - `TodayViewModel` — weekly progress, streak, Start Workout CTA command
  - `ActiveSessionViewModel` — set logging, rest timer, offline-first
  - `ProgressViewModel` — session history navigation
  - `CoachViewModel` — AI chat with streaming support stub
- **Pages** (XAML + code-behind for all 11 routes)
- `MetricChipView` — reusable metric chip control per M3E spec
- `ShellNavigationService` — `INavigationService` implementation (ViewModels never call `Shell.Current` directly)
- `MotionPreferenceService` — platform-specific partial class for iOS and Android reduce-motion detection
- M3E Color System — `Colors.xaml` with Primary, Secondary, Tertiary, Surface color tokens
- `Styles.xaml` — baseline Material 3 component styles

#### Exercise Seed Data
- 35 exercises across all major categories: Chest, Back, Shoulders, Legs, Deadlifts, Arms, Core, Flexibility, Cardio
- Each exercise includes: name, description, category, primaryMuscles, secondaryMuscles, equipment, difficulty, isCompound, instructions, researchNotes
- Research notes cite actual studies (Schoenfeld, Contreras, McGill, Maeo, Pedrosa, etc.)

#### Tests (`RepWizard.Tests`)
- **88 unit and integration tests — all pass**
- Domain entity tests: `UserEntityTests`, `ExerciseEntityTests`, `WorkoutSessionTests`, `ExerciseSetTests`, `TrainingProgramTests`, `ProgramWeekTests`, `TemplateExerciseTests`, `BodyMeasurementTests`
- Infrastructure integration tests: `RepositoryIntegrationTests`, `WorkoutSessionRepositoryTests`
- Uses xUnit, FluentAssertions, SQLite in-memory (via persistent SqliteConnection)
- Arrange-Act-Assert structure throughout

### Technical Standards Established
- `IHttpClientFactory` pattern enforced — zero raw `HttpClient` instantiations
- `Result<T>` pattern for all service returns — no exception-driven control flow
- MVVM strictly enforced — ViewModels have no XAML knowledge, Views have no business logic
- Soft-delete pattern with global EF Core query filters
- Specification pattern for all complex queries — no LINQ in ViewModels
- Offline-first architecture — all SQLite writes isolated, sync triggered separately
- CommunityToolkit.Mvvm source generators (`[ObservableProperty]`, `[RelayCommand]`)

---

## Phase 2 — Workout Logging (2026-02-20)

### Added

#### CQRS Infrastructure
- `ValidationBehavior<TRequest, TResponse>` — MediatR `IPipelineBehavior` that runs FluentValidation before every handler; returns `Result.Failure` without throwing (compatible with MediatR 12.5.0 delegate signature)
- `ValidationBehavior` registered in `DependencyInjection.cs` and API/MAUI MediatR setup

#### Exercise Queries
- `GetExercisesQuery` + `GetExercisesQueryHandler` — replaces direct repository call in `ExerciseEndpoints`
- `GetExerciseByIdQuery` + `GetExerciseByIdQueryHandler`
- `ExerciseEndpoints` refactored to dispatch through `IMediator`

#### Workout Session Commands & Queries
- `StartWorkoutSessionCommand` + handler — creates `WorkoutSession`, checks for existing active session, writes to SQLite
- `LogSetCommand` + handler — finds or creates `SessionExercise`, appends `ExerciseSet`, writes to SQLite (no API call during active session)
- `CompleteWorkoutSessionCommand` + handler — calls `session.Complete()`, triggers `ISyncService.SyncAsync` fire-and-forget
- `GetWorkoutSessionQuery` + handler — loads session with all exercises and sets
- `GetLastSessionDefaultsQuery` + handler — scans 90-day session history, returns dictionary of last working-set weight/reps per exercise for progressive overload pre-fill

#### FluentValidation Validators
- `StartWorkoutSessionCommandValidator` — UserId not empty
- `LogSetCommandValidator` — Reps > 0, WeightKg ≥ 0 if provided, RPE 1–10 if provided, RIR 0–10 if provided
- `CompleteWorkoutSessionCommandValidator` — SessionId not empty

#### API Endpoints
- `POST /api/v1/workouts/sessions` — start session
- `PUT /api/v1/workouts/sessions/{id}/log-set` — log a set (offline write path)
- `POST /api/v1/workouts/sessions/{id}/complete` — complete session and trigger sync
- `GET /api/v1/workouts/sessions/{id}` — get session detail

#### Infrastructure
- `SyncService` — concrete `ISyncService` stub; Phase 2 marks entities `Synced` locally; real HTTP push deferred to Phase 5
- `SyncService` registered in `DependencyInjection.cs`

#### MAUI ViewModel Wiring
- `ActiveSessionViewModel` — injected `IMediator`; `LogSetAsync` dispatches `LogSetCommand`, `CompleteSessionAsync` dispatches `CompleteWorkoutSessionCommand`, session load calls `GetLastSessionDefaultsQuery` for progressive overload defaults

#### Tests
- `StartWorkoutSessionCommandHandlerTests` (3 tests)
- `LogSetCommandHandlerTests` (4 tests)
- `CompleteWorkoutSessionCommandHandlerTests` (4 tests)
- `GetWorkoutSessionQueryHandlerTests` (3 tests)
- `StartWorkoutSessionCommandValidatorTests` (3 tests)
- `LogSetCommandValidatorTests` (8 tests)
- `ValidationBehaviorTests` (4 tests)

**Phase 2 total test count: 123 (88 Phase 1 + 35 new)**

---

## Phase 3 — Progress & History (2026-02-20)

### Added

#### Brand Design System
- `Colors.xaml` — replaced generic M3 palette with RepWizard brand colors derived from concept art: Primary `#00C8E8` (cyan), SurfaceColorDark `#0D1117` (deep navy), Tertiary `#64FFDA` (mint-teal achievement colour), Secondary `#8892B0` (silver-blue), `BrandGlow`, `BrandDeepSpace`, `BrandChrome`, `BrandStrength`, `Outline`
- `Styles.xaml` — dark-first M3E component styles: `HeadingLabel`, `SubheadingLabel`, `MetricValueLabel`, `SecondaryButton`, `TonalSurface` (CornerRadius 12), `ElevatedSurface` (CornerRadius 16), `HeroSurface` (cyan stroke, deep space background), `Divider`

#### Shared DTOs (`RepWizard.Shared`)
- `BodyMeasurementDto`, `LogBodyMeasurementRequest`
- `WorkoutHistoryDto` — lightweight list-item DTO (id, templateName, startedAt, durationMinutes, totalVolume, exerciseCount)
- `ExercisePRDto` — personal record per exercise (exerciseId, exerciseName, bestWeightKg, bestReps, bestLoad, achievedAt)
- `ProgressChartDataDto`, `VolumeDataPoint`, `StrengthDataPoint`, `BodyCompositionDataPoint`

#### Core Interfaces (`RepWizard.Core`)
- `IBodyMeasurementRepository` — `GetForUserAsync(userId, limit?, ct)`, `GetLatestForUserAsync(userId, ct)`
- `IWorkoutSessionRepository` extended with `GetSessionHistoryAsync(userId, page, pageSize, ct)` returning `(Items, TotalCount)`

#### Infrastructure (`RepWizard.Infrastructure`)
- `BodyMeasurementRepository` — EF Core implementation ordered by `RecordedAt` descending, optional limit
- `WorkoutSessionRepository.GetSessionHistoryAsync` — filters by UserId + CompletedAt != null, includes Template and SessionExercises/Sets, orders by StartedAt desc, skip/take pagination
- Both registered in `DependencyInjection.cs`

#### CQRS Commands & Queries
- `LogBodyMeasurementCommand` + handler — creates `BodyMeasurement`, at least one metric required
- `LogBodyMeasurementCommandValidator` — at least one of WeightKg/BodyFatPercent/MuscleKg required; WeightKg 0–500, BodyFatPercent 3–60, MuscleKg > 0
- `GetSessionHistoryQuery` + handler — paginated `PagedResult<WorkoutHistoryDto>`, completed sessions only
- `GetMeasurementHistoryQuery` + handler
- `GetProgressChartDataQuery` + handler — aggregates weekly volume (Monday-start weeks), extracts strength trends for top 3 most-frequently-trained exercises (best working set by `GetLoad()` per session), maps body composition timeline
- `GetExercisePRQuery` + handler — personal records per exercise by total load (weight × reps), optional `ExerciseId` filter, results ordered by best load descending

#### API Endpoints
- `POST /api/v1/measurements` — log new body measurement
- `GET /api/v1/measurements` — measurement history list
- `GET /api/v1/measurements/progress-chart` — chart data aggregate (calls `GetProgressChartDataQuery`)
- `GET /api/v1/workouts/sessions` — paginated session history list
- `GET /api/v1/workouts/prs` — personal records per exercise (with optional `exerciseId` filter)

#### MAUI ViewModels & Pages
- `ProgressViewModel` — paginated history via `GetSessionHistoryQuery`; `LoadMoreCommand`; `HasMorePages`
- `SessionDetailViewModel` — new; `GetWorkoutSessionQuery`; derives `DurationDisplay`, `VolumeDisplay`, `DateDisplay`
- `MeasurementsViewModel` — new; `GetMeasurementHistoryQuery` on load; `SaveMeasurementAsync` → `LogBodyMeasurementCommand`; `IsLoggingForm` toggle
- `ChartsViewModel` — new; parallel `Task.WhenAll(GetProgressChartDataQuery, GetExercisePRQuery)`; derives `TotalVolumeThisWeek`, `TotalSetsThisWeek`, `WeightChangeSinceStart`
- `ProgressPage.xaml` — `CollectionView` of `WorkoutHistoryDto`, Load More footer, Charts/Body navigation buttons
- `SessionDetailPage.xaml` — hero summary (date/duration/volume/exercises), nested sets grid with weight/reps/RPE
- `MeasurementsPage.xaml` — latest measurement `HeroSurface`, inline logging form (weight/body fat/muscle + notes), history `CollectionView`
- `ChartsPage.xaml` — summary metric row, 4W/12W/6M/1Y time range buttons, PR `CollectionView`, chart placeholder
- `SessionDetailViewModel`, `MeasurementsViewModel`, `ChartsViewModel` registered in `ViewModelRegistration.cs`

#### Tests
- `LogBodyMeasurementCommandHandlerTests` (3 tests)
- `LogBodyMeasurementCommandValidatorTests` (8 tests)
- `GetSessionHistoryQueryHandlerTests` (3 tests)
- `GetProgressChartDataQueryHandlerTests` (3 tests)
- `GetExercisePRQueryHandlerTests` (4 tests) — PR metric correctly uses total load (weight × reps), not raw weight

**Phase 3 total test count: 146 (123 Phase 1+2 + 23 new) — all passing**

---

## Phase 3 Gaps — Completed (2026-02-20)

### Added
- **ActiveSessionPage XAML** — full workout logging UI: exercise picker, set input form (weight/reps/RPE/RIR/SetType), logged sets list, rest timer overlay with countdown, elapsed time, session notes, complete session button
- **ActiveSessionViewModel** extensions — form state management, exercise loading via `GetExercisesQuery`, `LogSetFromFormCommand`, progressive overload default pre-fill, `IQueryAttributable` for Shell navigation params, elapsed time timer
- **TodayViewModel wired to real data** — injected `IMediator`; `LoadAsync` queries `GetSessionHistoryQuery` + `GetActiveSessionQuery`; calculates `WorkoutsThisWeek`, `WeeklyProgressPercent`, `MinutesTrainedThisWeek`, `TotalVolumeThisWeek`, `CurrentStreakDays`; `StartWorkoutAsync` sends `StartWorkoutSessionCommand` and navigates with session ID
- **ExerciseLibraryPage** — searchable exercise list with category filter chips, paginated CollectionView, tap-to-detail navigation
- **ExerciseLibraryViewModel** — search, category filter, paginated loading via `GetExercisesQuery`, `LoadMoreCommand`
- **ExerciseDetailPage** — full exercise detail view (name, category, equipment, difficulty, description, muscles, instructions, research notes)
- **ExerciseDetailViewModel** — `IQueryAttributable` for exercise ID, loads via `GetExerciseByIdQuery`
- `GetActiveSessionQuery` — new CQRS query + handler for checking active sessions
- `InverseBoolConverter` — added to converters, registered in App.xaml

**Post-gap test count: 146 (no regressions)**

---

## Phase 4 — AI Coach (2026-02-20)

### Added

#### AI Services
- `IAiChatService` interface in Core + `AnthropicChatService` implementation in Infrastructure (HttpClient-based, SSE streaming)
- `AiContextBuilder` service — builds structured user context (profile, recent workouts, volume landmarks, fatigue indicators)
- `ProgramValidator` — enforces science-based constraints: MRV limits per muscle group, deload week requirement, CNS load rules, recovery windows, beginner constraints

#### CQRS Commands & Queries
- `SaveAiMessageCommand` + handler + validator — persists `AiMessage` entities, creates conversations on first message
- `GetConversationQuery` + handler — loads conversation with messages
- `GetConversationsQuery` + handler — lists user's conversations
- `GetTrainingProgramsQuery` + handler — lists user's training programs
- `GetTrainingProgramByIdQuery` + handler — loads program with weeks and days

#### AI & Program DTOs
- `AiConversationDto`, `AiConversationDetailDto`, `AiMessageDto`, `SendChatRequest`, `GenerateProgramRequest`
- `TrainingProgramDto`, `TrainingProgramDetailDto`, `ProgramWeekDto`, `ProgramDayDto`

#### API Endpoints
- `POST /api/v1/ai/chat` — SSE streaming endpoint with context injection
- `GET /api/v1/ai/conversations` — list user conversations
- `GET /api/v1/ai/conversations/{id}` — get conversation with messages
- `POST /api/v1/ai/generate-program` — program generation endpoint

#### Infrastructure
- `IAiConversationRepository` + `AiConversationRepository` — conversation persistence with eager-loaded messages
- `ITrainingProgramRepository` + `TrainingProgramRepository` — program persistence with nested weeks/days

#### MAUI ViewModels & Pages
- `CoachViewModel` — SSE streaming chat UI with message bubbles, cancel support, conversation persistence
- `CoachPage` — chat interface with message list, input field, streaming indicator
- `ProgramsViewModel` — program list with cards, active badge, metadata chips
- `ProgramsPage` — program list UI with navigation to detail
- `ProgramDetailViewModel` — week-by-week view with AI reasoning section
- `ProgramDetailPage` — nested week/day display
- `BoolToAlignmentConverter` for chat bubble positioning

#### Tests
- `AiContextBuilderTests` (6 tests) — mock user/session data, context building
- `ProgramValidatorTests` (12 tests) — every science constraint rule

**Phase 4 total test count: 164 (146 + 18 new)**

---

## Phase 5 — Auth, Sync & Polish (2026-02-21)

### Added

#### Authentication
- JWT authentication with PBKDF2 password hashing (`JwtAuthService`)
- `POST /api/v1/auth/register` — register new user, returns JWT + refresh token
- `POST /api/v1/auth/login` — authenticate, returns JWT + refresh token
- `POST /api/v1/auth/refresh` — refresh expired access token
- `RegisterCommand` + handler + validator (name, email, password validation)
- `LoginCommand` + handler + validator
- `RefreshTokenCommand` + handler + validator
- User entity extended with `PasswordHash`, `RefreshToken`, `RefreshTokenExpiresAt`
- JWT middleware configured in API (`UseAuthentication`, `UseAuthorization`)
- JWT settings externalized to `appsettings.json`

#### Profile Management
- `GET /api/v1/users/{id}` — get user profile
- `PUT /api/v1/users/{id}` — update user profile
- `GetUserProfileQuery` + handler
- `UpdateProfileCommand` + handler + validator (height/weight range validation)
- `SettingsPage` — full profile management UI (edit toggle, fitness goal, experience level, sync status)
- `SettingsViewModel` — profile load/save via MediatR, sync trigger

#### Sync Service
- Full `SyncService` implementation with real HTTP push/pull via `IHttpClientFactory`
- `POST /api/v1/sync/push` API endpoint — processes client changes, detects conflicts
- `GET /api/v1/sync/pull` API endpoint — returns server changes since timestamp
- Conflict detection: server-wins resolution with local copy preserved
- `ConflictLog` entity + persistence (EntityType, EntityId, LocalJson, ServerJson, Resolution)
- Fallback to local-only sync when API is unreachable
- Polly resilience policies on `HttpClient` (retry + circuit breaker via `Microsoft.Extensions.Http.Resilience`)

#### Tests
- `RegisterCommandHandlerTests` (3 tests)
- `LoginCommandHandlerTests` (3 tests)
- `RegisterCommandValidatorTests` (5 tests)
- `UpdateProfileCommandHandlerTests` (3 tests)
- `JwtAuthServiceTests` (8 tests — password hashing, token generation, validation)
- `AuthEndpointTests` — API integration tests via `WebApplicationFactory` (4 tests)

**Phase 5 total test count: 190 (164 + 26 new)**

---

## Hardening Pass (2026-02-21)

### Fixed

#### Security
- Removed JWT secret from `appsettings.json` (was committed to source control)
- Moved JWT secret to `appsettings.Development.json` (git-ignored in production)
- Fail-fast in `Program.cs` and `JwtAuthService` if `Jwt:Secret` is not configured
- Moved hardcoded API base URL to `IConfiguration` in `MauiProgram.cs`

#### Code Quality
- Fixed CS0618: replaced deprecated `MainPage` setter with `CreateWindow` pattern in `App.xaml.cs`
- Fixed CS8602: null-forgiving operators on test assertions
- Added `OperationCanceledException` catch before generic `Exception` in `SyncService.SyncAsync`
- 0 compiler warnings across all buildable targets

### Added

#### Observability
- `GlobalExceptionMiddleware` — catches unhandled exceptions, returns `supportId` for incident triage
- `CorrelationIdMiddleware` — propagates `X-Correlation-Id` header, adds to structured log scope

#### Test Infrastructure
- Extracted `IntegrationTestBase` — shared `WebApplicationFactory` + SQLite in-memory setup
- Refactored `AuthEndpointTests` to inherit from `IntegrationTestBase`

#### Performance
- Added `.AsNoTracking()` to all read-only repository queries (6 repositories, 15 methods)

**Post-hardening: 190 tests, 0 warnings**

---

## Test Gap Closure (2026-02-21)

### Added
- Auth integration tests (+5): duplicate email, login flow, refresh flow, invalid refresh, missing password, protected endpoint without token
- Exercise endpoint integration tests (+5): paginated list, search filter, category filter, get by ID, not found
- Workout endpoint integration tests (+8): start session, empty userId, get session, not found, log set, invalid reps, complete session, session history pagination
- Measurement endpoint integration tests (+5): log, no metrics, history list, limit, progress chart
- Middleware integration tests (+5): correlation ID generation/echo, multiple requests get different IDs, exception returns 500 with supportId, correlation ID survives exception path
- Sync service unit tests (+8): pending changes detection, push flow, skip when nothing pending, conflict handling, API unreachable fallback, cancellation, unexpected exception

### Fixed
- **BUG-1**: No endpoints enforced auth — added `.RequireAuthorization()` to Users, Workouts, Measurements, AI, Sync endpoint groups
- **BUG-2**: `AsNoTracking` + client-generated Guids caused silent write failures — added `MarkAsNew()` on `BaseEntity` to reset Id for EF Core sentinel check
- **BUG-3**: Circular reference in SyncService serialization — added `ReferenceHandler.IgnoreCycles`

**Post-closure: 227 tests (190 + 37 new)**

---

## Code Quality Pass (2026-02-22)

### Changed
- Replaced magic strings in sync layer with `SyncConstants.SyncEntityTypes` and `SyncConstants.SyncActions` (shared constants class)
- Extracted duplicated SSE parsing to `SseParser.TryParseDataLine()` shared helper
- Added `ILogger` to `JwtAuthService`, `AnthropicChatService` — replaced silent catches with typed exception catches + logging
- `CoachViewModel` catch blocks now log via `Debug.WriteLine`
- `GlobalExceptionMiddleware` now environment-aware — Development returns actual exception details, Production returns generic message

**Post-quality pass: 227 tests, 0 warnings**

---

## Dev Tooling (2026-02-22)

### Added
- `RepWizard.Dev.slnf` — development solution filter (includes UI, excludes App host for Windows builds)
- `RepWizard.CI.slnf` — CI solution filter (excludes all MAUI projects)
- `.vscode/tasks.json` — Build, Test, Build Android, MAUI emulator tasks, Run API, compound tasks
