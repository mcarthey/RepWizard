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

## Phase 2 — Workout Logging 🔄 IN PROGRESS

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

**Phase 2 target test count: 88 (existing) + ~30 new handler/validator tests**

---

## Phase 3 — Progress & History ⏳ PENDING

> Target: Users can review their workout history, body measurements, and strength charts.

- [ ] `GetSessionHistoryQuery` + handler (paginated session list for user)
- [ ] `GetSessionDetailQuery` + handler (full session with sets for review)
- [ ] `LogBodyMeasurementCommand` + handler + validator
- [ ] `GetMeasurementHistoryQuery` + handler
- [ ] `GetProgressChartDataQuery` + handler (strength curves, volume trends)
- [ ] `GetExercisePRQuery` + handler (personal record tracking per exercise)
- [ ] Implement `SessionDetailPage` / `SessionDetailViewModel` with real data
- [ ] Implement `MeasurementsPage` / `MeasurementsViewModel` with log + history
- [ ] Implement `ChartsPage` / `ChartsViewModel` with Microcharts or LiveCharts
- [ ] `POST /api/v1/measurements` endpoint
- [ ] `GET /api/v1/measurements` endpoint
- [ ] `GET /api/v1/measurements/progress-chart` endpoint
- [ ] `GET /api/v1/workouts/sessions` history list endpoint
- [ ] `GET /api/v1/workouts/sessions/{id}` detail endpoint (if not already in Phase 2)
- [ ] Write handler tests for all Phase 3 commands/queries

---

## Phase 4 — AI Coach ⏳ PENDING

> Target: Users can chat with the AI coach and generate a science-validated training program.

- [ ] Integrate Anthropic .NET SDK in `RepWizard.Api`
- [ ] Externalize AI system prompt to `appsettings.json` (`AiCoach:SystemPrompt`)
- [ ] `POST /api/v1/ai/chat` — SSE streaming endpoint
- [ ] `AiContextBuilder` service — builds structured user context for every AI call
- [ ] `SaveAiMessageCommand` + handler — persists `AiMessage` entities
- [ ] `GetConversationQuery` + handler
- [ ] `POST /api/v1/ai/generate-program` — two-phase: stream then parse + persist
- [ ] `ProgramValidator` — enforces MRV limits, deload requirement, CNS load rules, recovery windows
- [ ] Implement `CoachPage` / `CoachViewModel` with streaming chat UI
- [ ] Implement `ProgramsPage` / `ProgramsViewModel` with program list
- [ ] Implement `ProgramDetailPage` / `ProgramDetailViewModel` (week-by-week view)
- [ ] Wire generated program into Today tab (scheduled session display)
- [ ] `AiContextBuilderTests` — unit tests with mock user/session data
- [ ] `ProgramValidatorTests` — unit tests for every science constraint rule

---

## Phase 5 — Polish & Cross-Platform ⏳ PENDING

> Target: Production-ready, cross-platform, fully synced app.

- [ ] Adaptive layouts for tablet and desktop (Windows/macOS)
- [ ] Dark mode support with proper resource dictionary theming
- [ ] Notification service — rest timer alerts, scheduled workout reminders
- [ ] JWT authentication (`POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`)
- [ ] Profile management (`GET/PUT /users/{id}`)
- [ ] Full `SyncService` implementation with real HTTP push/pull
- [ ] `POST /api/v1/sync/push` API endpoint
- [ ] `GET /api/v1/sync/pull` API endpoint
- [ ] Conflict resolution UI (surface `SyncState.Conflict` entities to user)
- [ ] `ConflictLog` entity + persistence
- [ ] Polly resilience policies on `HttpClient` (retry, circuit breaker)
- [ ] App store packaging (Android APK/AAB, iOS IPA)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Sync logic unit tests (conflict detection and resolution)
- [ ] API endpoint integration tests via `WebApplicationFactory` for critical paths

---

## Cross-Cutting / Ongoing

- [ ] Keep `CHANGELOG.md` updated at every phase gate
- [ ] Keep `TASKS.md` (this file) updated as tasks are completed
- [ ] Run full test suite before marking any phase complete
- [ ] Apply anti-pattern checklist (`IMPLEMENTATION.md` Section 11) at every phase gate
