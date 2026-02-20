# RepWizard — Architecture Reference

> Generated from the master build specification (IMPLEMENTATION.md) and verified against the actual codebase.
> This document is the canonical reference for architectural decisions. Update it when decisions change.

---

## 1. Solution Structure

RepWizard uses Clean Architecture (Onion pattern) with 8 projects. Dependency flow is strictly one-directional — Core has no outbound dependencies.

```
RepWizard.Core          ←  no outbound dependencies (domain kernel)
RepWizard.Shared        ←  no outbound dependencies (DTOs, contracts)
RepWizard.Application   ←  Core, Shared
RepWizard.Infrastructure←  Core, Shared, Application
RepWizard.Api           ←  Application, Infrastructure, Shared
RepWizard.Tests         ←  Core, Application, Infrastructure, Shared
RepWizard.App (MAUI)    ←  UI, Application, Infrastructure, Shared
RepWizard.UI (MAUI)     ←  Application, Core, Shared
```

| Project | Responsibility |
|---|---|
| `RepWizard.Core` | Domain entities, interfaces, business rules, enums — zero external dependencies |
| `RepWizard.Shared` | DTOs and API contracts shared between server and client (NuGet-able) |
| `RepWizard.Application` | Use-case CQRS commands/queries and MediatR handlers; FluentValidation validators |
| `RepWizard.Infrastructure` | EF Core DbContext, repository implementations, migrations, seeding |
| `RepWizard.Api` | ASP.NET Core Minimal API host — endpoint groups, OpenAPI docs |
| `RepWizard.App` | .NET MAUI application shell — DI wiring, navigation, platform entry points |
| `RepWizard.UI` | XAML pages, controls, view-models (MVVM, no business logic) |
| `RepWizard.Tests` | xUnit unit + integration tests for Core and Application layers |

---

## 2. Technology Stack

| Concern | Technology |
|---|---|
| Runtime | .NET 9 |
| Mobile/Desktop UI | .NET MAUI + CommunityToolkit.Maui |
| MVVM | CommunityToolkit.Mvvm (source generators, ObservableObject, RelayCommand) |
| REST API | ASP.NET Core Minimal APIs with endpoint groups |
| ORM | Entity Framework Core 9 — SQLite (local) + PostgreSQL (server) |
| CQRS Mediator | MediatR 12 |
| Validation | FluentValidation 11 |
| HTTP Client | IHttpClientFactory + Polly resilience (never raw HttpClient) |
| AI Integration | Anthropic Claude API via official .NET SDK (streaming SSE) |
| Charts | Microcharts.Maui or LiveChartsCore.SkiaSharpView.Maui |
| Testing | xUnit, Moq, FluentAssertions, Testcontainers |
| API Docs | Scalar / Swashbuckle OpenAPI |

---

## 3. Key Architectural Patterns

### 3.1 Clean Architecture (Onion)

Core has no outbound dependencies. Infrastructure depends on Core. API and App depend on Application. No layer skips — UI never calls Infrastructure directly.

### 3.2 CQRS via MediatR

All business operations are either a **Command** (write intent, returns `Result<T>`) or a **Query** (read intent, returns `Result<T>`). Endpoints and ViewModels call `IMediator.Send(request)` — they never call repositories directly.

```
Endpoint/ViewModel
  → mediator.Send(command or query)
    → ValidationBehavior (FluentValidation runs first)
      → Handler (calls repository, applies domain logic)
        → Result<T> returned up the stack
```

**Folder layout in `RepWizard.Application`:**
```
Commands/
  Workouts/
    StartWorkoutSession/  (command + handler + validator)
    LogSet/
    CompleteWorkoutSession/
Queries/
  Exercises/
    GetExercises/         (query + handler)
    GetExerciseById/
  Workouts/
    GetWorkoutSession/
Behaviors/
  ValidationBehavior.cs
```

### 3.3 Repository + Specification Pattern

Repositories are interface-defined in `RepWizard.Core` and implemented in `RepWizard.Infrastructure`. Complex queries use the Specification pattern — no LINQ in ViewModels or handlers beyond simple `.Where`.

```csharp
IRepository<T> : IReadRepository<T>, IWriteRepository<T>

// Domain-specific extensions:
IExerciseRepository : IRepository<Exercise>
IWorkoutSessionRepository : IRepository<WorkoutSession>
IUserRepository : IRepository<User>
```

### 3.4 Result\<T\> Pattern

No exception-driven control flow for expected failures. Every service/handler returns `Result<T>` (or non-generic `Result`).

```csharp
Result<T>.Success(value)
Result<T>.Failure("error message")
Result<T>.Failure(IEnumerable<string> errors)   // multi-error (validation)

result.Match(
    onSuccess: value => ...,
    onFailure: error => ...
);
```

### 3.5 MVVM (MAUI)

- ViewModels inherit `BaseViewModel` (`ObservableObject`, `IsLoading`, `HasError`, `ErrorMessage`, `IsEmpty`).
- `[ObservableProperty]` and `[RelayCommand]` source generators — zero manual `INotifyPropertyChanged` boilerplate.
- Navigation via `INavigationService` abstraction — ViewModels never call `Shell.Current` directly.
- No `async void` except event handlers. All async operations use `CancellationToken`.

### 3.6 Offline-First Architecture

All writes during an active session go to **local SQLite first**. Zero API calls during a workout. Sync is triggered explicitly on session completion (or on app resume).

```
Set logged
  → SQLite write (immediate, no network)
  → Entity.SyncState = New

Session complete
  → SQLite write
  → ISyncService.SyncAsync() triggered
    → POST /api/v1/sync/push  (pending entities)
    → GET /api/v1/sync/pull   (server changes since last sync)
```

### 3.7 HTTP Client (Anti-Memory-Leak Rule)

**Never** instantiate `HttpClient` directly — this caused production memory leaks in prior iterations. Always use `IHttpClientFactory`:

```csharp
// Registered once in MauiProgram.cs / Program.cs:
builder.Services.AddHttpClient("RepWizardApi", client =>
{
    client.BaseAddress = new Uri("https://localhost:7001");
    client.Timeout = TimeSpan.FromSeconds(30);
});

// Injected via constructor:
public MyService(IHttpClientFactory factory)
{
    _client = factory.CreateClient("RepWizardApi");
}
```

---

## 4. Domain Model

All entities live in `RepWizard.Core.Entities` and inherit `BaseEntity`.

### 4.1 BaseEntity

```csharp
public abstract class BaseEntity
{
    public Guid Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }        // soft-delete
    public SyncState SyncState { get; set; }   // offline-first tracking
    public DateTime? LastSyncedAt { get; set; }
}
```

### 4.2 Core Entities

| Entity | Key Responsibilities |
|---|---|
| `User` | Profile, fitness goal, experience level; `CalculateAge()`, `GetGoalDescription()` |
| `Exercise` | Library entry — muscles, equipment, instructions; `IsHighCnsDemand()` |
| `WorkoutTemplate` | Reusable plan; `GetTotalSetCount()`, `GetTargetedMuscles()` |
| `TemplateExercise` | Junction with rep range, progression rule; `IsRepRangeValid()` |
| `WorkoutSession` | Active/completed session; `Complete()`, `GetTotalVolume()`, `GetDuration()` |
| `SessionExercise` | Exercise within session; `GetBestSet()`, `GetTotalVolume()` |
| `ExerciseSet` | Individual set with weight, reps, RPE, RIR; `EstimateRpeFromRir()` |
| `TrainingProgram` | Multi-week AI or manual plan; `Activate()`, `HasRequiredDeloadWeek()` |
| `ProgramWeek` | Weekly block with volume multiplier; `IsVolumeMultiplierValid()` |
| `ProgramDay` | Daily prescription or rest day |
| `BodyMeasurement` | Body composition snapshot; `CalculateLeanBodyMass()`, `CalculateFatMass()` |
| `AiConversation` | Chat thread with AI coach; `GetTotalTokensUsed()` |
| `AiMessage` | Single chat message with role, content, token count |

### 4.3 Enumerations

All enums live in `RepWizard.Core.Enums`. Every value has `[EnumMember(Value=...)]` and `[Description(...)]` attributes for display binding.

| Enum | Values |
|---|---|
| `FitnessGoal` | StrengthGain, MuscleHypertrophy, FatLoss, GeneralFitness, Endurance, PowerAndAthletics, Rehabilitation |
| `ExperienceLevel` | Beginner, Novice, Intermediate, Advanced, Elite |
| `ExerciseCategory` | Strength, Cardio, Flexibility, Balance, Power, Rehabilitation, Warmup, Cooldown |
| `Equipment` | Barbell, Dumbbell, Machine, Cable, Bodyweight, Kettlebell, Bands, TRX, None |
| `SetType` | Warmup, Working, Dropset, FailureSet, ForceRep, NegativeOnly, IsometricHold |
| `ProgressionRule` | LinearLoad, DoubleProgression, RPEBased, PercentageOfMax, Autoregulated, Deload |
| `MuscleGroup` | Chest, Back, Shoulders, Biceps, Triceps, Forearms, Quads, Hamstrings, Glutes, Calves, Core, FullBody, Traps, Lats |
| `SyncState` | New, Modified, Synced, Conflict |

---

## 5. Data Layer

### 5.1 Dual-Database Strategy

| Environment | Database | Provider |
|---|---|---|
| MAUI client | SQLite (`RepWizard.db` in LocalApplicationData) | Microsoft.EntityFrameworkCore.Sqlite |
| API server | PostgreSQL | Npgsql.EntityFrameworkCore.PostgreSQL |

Both use the same `AppDbContext` class — provider is swapped via DI at startup. The MAUI client uses `EnsureCreated()` (no migrations), the server uses full EF Core migrations via `dotnet ef database update`.

### 5.2 AppDbContext Behaviours

- **Global soft-delete filter** — `IsDeleted == false` applied to all entities.
- **Audit field automation** — `SaveChangesAsync` override sets `CreatedAt`, `UpdatedAt` automatically.
- **Sync state tracking** — entities transition from `Synced` → `Modified` automatically on update.
- **JSON columns** — `MuscleGroup` lists and `string` lists (instructions, photos) serialized as JSON in SQLite.

### 5.3 Offline Sync

```
Entity states:  New → (push) → Synced
                Synced → (local edit) → Modified → (push) → Synced
                Modified → (concurrent server edit) → Conflict

Conflict resolution: server-wins by default; local copy preserved in ConflictLog.

Sync triggers:
  - Explicit user action (Settings page)
  - App resume from background
  - Session completion
```

Sync endpoints (Phase 2):
- `POST /api/v1/sync/push` — client uploads `New` and `Modified` entities
- `GET /api/v1/sync/pull?since={timestamp}` — client fetches server changes

---

## 6. API Design

### 6.1 Conventions

- Runtime: ASP.NET Core 9 Minimal APIs with endpoint groups
- Base path: `/api/v1/`
- Auth: JWT bearer on all routes except `/api/v1/auth/*` (Phase 5)
- All responses use `ApiResponse<T>` envelope — never naked objects

```json
{
  "success": true,
  "data": {},
  "message": null,
  "errors": [],
  "pagination": { "page": 1, "pageSize": 20, "totalCount": 150, "totalPages": 8 }
}
```

### 6.2 Endpoint Groups

| Group | Routes |
|---|---|
| Health | `GET /health` |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh` |
| Users | `GET /users/{id}`, `PUT /users/{id}/profile`, `GET /users/{id}/stats` |
| Exercises | `GET /exercises`, `GET /exercises/{id}`, `POST /exercises`, `PUT /exercises/{id}` |
| Workouts | `POST /workouts/sessions`, `PUT /workouts/sessions/{id}/log-set`, `POST /workouts/sessions/{id}/complete`, `GET /workouts/sessions/{id}` |
| Templates | `GET /templates`, `POST /templates`, `GET /templates/{id}`, `PUT /templates/{id}`, `DELETE /templates/{id}` |
| Programs | `GET /programs`, `GET /programs/{id}`, `POST /programs/generate`, `PUT /programs/{id}`, `DELETE /programs/{id}` |
| Measurements | `GET /measurements`, `POST /measurements`, `GET /measurements/progress-chart` |
| AI Coach | `POST /ai/chat` (SSE), `POST /ai/analyze-progress`, `POST /ai/generate-program`, `GET /ai/conversations`, `GET /ai/conversations/{id}` |
| Sync | `POST /sync/push`, `GET /sync/pull` |

### 6.3 CQRS Request Flow (API)

```
POST /workouts/sessions/{id}/log-set
  → mediator.Send(new LogSetCommand(sessionId, request))
    → ValidationBehavior → LogSetCommandValidator
      → LogSetCommandHandler
        → IWorkoutSessionRepository.GetWithExercisesAndSetsAsync()
        → session.AddSet(...)   // domain logic on entity
        → repository.SaveChangesAsync()
        → Result<ExerciseSetDto>.Success(dto)
  → 200 ApiResponse<ExerciseSetDto>  |  400 ApiResponse with errors
```

---

## 7. MAUI Client

### 7.1 Shell Navigation Structure

```
Shell (3 tabs)
├── Today (tab)
│   ├── //today                    TodayViewModel
│   ├── //today/active-session     ActiveSessionViewModel
│   └── //today/exercise-detail/{id}  ExerciseDetailViewModel
├── Progress (tab)
│   ├── //progress                 ProgressViewModel
│   ├── //progress/session/{id}    SessionDetailViewModel
│   ├── //progress/charts          ChartsViewModel
│   └── //progress/measurements    MeasurementsViewModel
└── Coach (tab)
    ├── //coach                    CoachViewModel
    ├── //coach/programs           ProgramsViewModel
    ├── //coach/program/{id}       ProgramDetailViewModel
    ├── //coach/library            ExerciseLibraryViewModel
    └── //settings                 SettingsViewModel
```

### 7.2 ViewModel Conventions

- Inherit `BaseViewModel` (provides `IsLoading`, `HasError`, `ErrorMessage`, `IsEmpty`, `ExecuteSafeAsync`)
- Inject `IMediator` for all data operations — no direct repository injection
- Inject `INavigationService` for navigation — never `Shell.Current`
- All async commands use `CancellationToken` from `[RelayCommand(IncludeCancelCommand = true)]` where appropriate
- Max 300 lines per ViewModel — extract to sub-ViewModels if exceeded

### 7.3 Active Session — Offline-First Contract

The `ActiveSessionViewModel` is the core interaction surface. Key rules:
- All set logging goes through `LogSetCommand` → SQLite write → no network
- Rest timer runs locally via `CancellationTokenSource`
- Progressive overload defaults pre-filled from last session (via `GetLastSessionDefaultsQuery`)
- Session state is durable — app can be backgrounded and resumed without data loss
- Sync triggered only on `CompleteSessionCommand`

---

## 8. AI Coach

### 8.1 Claude Integration

- API: `POST /api/v1/ai/chat` returns Server-Sent Events (SSE)
- MAUI reads stream via `ReadAsStreamAsync` + `StreamReader`, cancelled on dismiss
- Client: `IHttpClientFactory` named client, never raw `HttpClient`

### 8.2 System Prompt

Stored in `appsettings.json` under `AiCoach:SystemPrompt`. Never hardcoded inline. The AI Coach persona is an evidence-based strength and conditioning specialist grounded in periodization science, RP methodology, and injury prevention.

### 8.3 Context Injection

Every AI call includes a structured JSON context block built by `AiContextBuilder`:

| Field | Source |
|---|---|
| `user.goal` / `user.experience` / `user.age` | User entity |
| `recentWorkouts` | Last 14 days of WorkoutSession summaries |
| `currentProgram` | Active TrainingProgram, current week |
| `weeklyVolume` | Sets per muscle group (past 7 days vs targets) |
| `progressionTrends` | 3-month rolling trend for top 3 exercises |
| `fatigueIndicators` | Days since rest, session frequency, avg RPE last week |

### 8.4 Program Generation

1. AI gathers: goal, experience, days/week, session length, equipment, injuries
2. `POST /api/v1/ai/generate-program` builds full context + streams structured response
3. Two-phase: stream to UI first, then parse + persist as `TrainingProgram` entity
4. `ProgramValidator` enforces science-based constraints (MRV limits, deload requirement, CNS load rules)

---

## 9. Testing Strategy

All tests in `RepWizard.Tests`. All assertions use `FluentAssertions`. Arrange-Act-Assert throughout.

| Layer | Approach |
|---|---|
| Domain entities (Core) | Pure unit tests — no mocks, no database |
| MediatR handlers (Application) | Unit tests with `Moq` mocked repositories |
| FluentValidation validators | Unit tests with direct validator instantiation |
| Repositories (Infrastructure) | Integration tests with SQLite in-memory persistent connection |
| API endpoints | Integration tests with `WebApplicationFactory` |
| Sync logic | Unit tests for conflict detection and resolution |
| AI context builder | Unit tests with mock user/session data |
| Program validator | Unit tests for every science constraint rule |

---

## 10. Design System (M3E)

UI follows Material 3 Expressive (M3E). Key principles:

- **Command Center mental model** — one dominant CTA (Start Workout) at all times
- **60% clarity / 40% expressive energy** — no concept-art aesthetics
- **Motion serves communication** — state change, confirmation, hierarchy, progress. No decorative motion.
- **Reduce Motion compliance** — all animations respect OS accessibility settings via `IMotionPreferenceService`

Implementation notes:
- Hero circular progress arc → `GraphicsView` + SkiaSharp (gradient stroke requires it)
- Start Workout breathing animation → `ScaleXTo/ScaleYTo` in looping `Animation` object
- Tonal surface containers → MAUI `Border` with `StrokeShape=RoundRectangle`
- `MetricChipView` → reusable `ContentView` in `RepWizard.UI/Controls/`
- Bottom navigation → MAUI Shell `TabBar` with custom active pill indicator

---

## 11. Anti-Patterns (Lessons from Prior Iterations)

| Pattern | Why Forbidden |
|---|---|
| Raw `new HttpClient()` | Caused production socket exhaustion in prior iteration |
| Exception-driven control flow | Use `Result<T>` for expected failures |
| LINQ in ViewModels | Use Specification pattern; queries belong in repositories |
| `Shell.Current` in ViewModels | Use `INavigationService` abstraction |
| Business logic in Views/XAML code-behind | MVVM strictly enforced |
| Adding AI features before core loop works | Scope creep → prior abandonment |
| Anemic domain model (entities as pure data bags) | Domain logic belongs on entities |
| Single database for client + server | Dual-database strategy is non-negotiable |
| Hardcoded AI system prompts | Externalize to `appsettings.json` |
| God ViewModels (>300 lines) | Extract to sub-ViewModels or services |
