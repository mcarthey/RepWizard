# RepWizard
## Fitness Tracker & AI Coach
### Master AI Build Prompt — v1.0

---

## 1. Context & Background

This prompt distills three prior iterations of the RepWizard fitness tracker project into a single, authoritative specification for a greenfield implementation. The three codebases — **RepWizard** (TypeScript/React full-stack web app), **RepWizard-MAUI** (layered .NET MAUI with App/Core/Infrastructure/Services projects), and **ExerciseTracker** (single-project .NET MAUI with Controls/Models/Services) — each explored different approaches to the same domain. None reached production-ready status. The new implementation should learn from every iteration and start clean, carrying forward only the domain understanding, not the technical debt.

| Attribute | Value |
|---|---|
| **Application Name** | RepWizard |
| **Prior Repos** | RepWizard, RepWizard-MAUI, ExerciseTracker |
| **Stack Decision** | .NET MAUI client (cross-platform) + ASP.NET Core REST API |
| **Primary Use Case** | Gym-floor workout logging with AI-driven programming guidance |
| **Target Platforms** | Android, iOS, Windows, macOS (single MAUI codebase) |
| **Owner** | Personal / small-team fitness application |

---

## 2. Architecture & Technology Decisions

### 2.1 Solution Structure

The solution must be organized as a multi-project .NET solution with the following projects. Do not collapse layers — clean separation of concerns is a first-class requirement.

| Project | Responsibility |
|---|---|
| **RepWizard.App** | .NET MAUI application shell — navigation, DI wiring, platform entry points |
| **RepWizard.UI** | XAML pages, controls, view-models (MVVM pattern, no business logic) |
| **RepWizard.Core** | Domain entities, interfaces, business rules, enums — zero external dependencies |
| **RepWizard.Application** | Use-case services, CQRS commands/queries, validation (MediatR) |
| **RepWizard.Infrastructure** | EF Core DbContext, repository implementations, HTTP clients, migrations |
| **RepWizard.Api** | ASP.NET Core Minimal API host — endpoint groups, OpenAPI docs |
| **RepWizard.Shared** | DTOs and contracts shared between API and MAUI client (NuGet-able) |
| **RepWizard.Tests** | xUnit test project — unit + integration tests for Core and Application layers |

### 2.2 Technology Stack

| Concern | Technology / Package |
|---|---|
| **Runtime** | .NET 9 |
| **Mobile/Desktop UI** | .NET MAUI + CommunityToolkit.Maui |
| **MVVM** | CommunityToolkit.Mvvm (source generators, ObservableObject, RelayCommand) |
| **REST API** | ASP.NET Core Minimal APIs with endpoint groups |
| **ORM** | Entity Framework Core 9 with SQLite (local) + PostgreSQL (server) |
| **Migrations** | EF Core Migrations, code-first |
| **API Docs** | Scalar / Swashbuckle OpenAPI |
| **Dependency Injection** | Microsoft.Extensions.DependencyInjection (built-in) |
| **CQRS Mediator** | MediatR 12 |
| **Validation** | FluentValidation |
| **HTTP Client** | System.Net.Http.HttpClient with Polly resilience policies (no memory-leak pattern) |
| **AI Integration** | Anthropic Claude API via official .NET SDK (streaming support) |
| **Charts** | Microcharts.Maui or LiveChartsCore.SkiaSharpView.Maui |
| **Local Storage** | SQLite via EF Core (offline-first with sync capability) |
| **Auth (future)** | OIDC / ASP.NET Core Identity — stubs only in v1 |
| **Testing** | xUnit, Moq, FluentAssertions, Testcontainers |

### 2.3 Key Architectural Patterns

- **Clean Architecture (Onion)** — Core has no outbound dependencies; Infrastructure depends on Core; API and App depend on Application.
- **MVVM strictly enforced in MAUI** — ViewModels contain no XAML knowledge; Views contain no business logic.
- **Repository + Unit of Work** — abstract data access behind interfaces in Core; implement in Infrastructure.
- **CQRS via MediatR** — all business operations are Commands or Queries with explicit request/response types.
- **Offline-first** — all writes go to local SQLite first; a background sync service pushes to the server API when connected.
- **Result\<T\> pattern** — no exception-driven control flow; every service returns a typed Result with success/failure discrimination.
- **HttpClient factory pattern** — never instantiate HttpClient directly; always use `IHttpClientFactory` to prevent socket exhaustion (this was a known production issue in prior iterations).

---

## 3. Domain Model

All entities live in `RepWizard.Core.Entities`. Every entity inherits from a `BaseEntity` that provides `Id` (Guid), `CreatedAt`, `UpdatedAt`, and `IsDeleted` (soft-delete). The schema below is the canonical reference — do not invent additional entities without documenting them.

### 3.1 Core Entities

| Entity | Purpose & Key Properties |
|---|---|
| **User** | Profile: Id, Name, Email, DateOfBirth, HeightCm, WeightKg, FitnessGoal (enum), ExperienceLevel (enum), MedicalNotes |
| **Exercise** | Library entry: Id, Name, Description, Category (enum), PrimaryMuscles (collection), SecondaryMuscles, Equipment (enum), Difficulty (enum), IsCompound (bool), VideoUrl, Instructions (list of string), ResearchNotes |
| **WorkoutTemplate** | Reusable plan: Id, Name, Description, UserId, TemplateExercises (collection), EstimatedDurationMinutes, Tags |
| **TemplateExercise** | Junction: WorkoutTemplateId, ExerciseId, SetCount, RepRange (min/max), RestSeconds, ProgressionRule (enum), Notes |
| **WorkoutSession** | A completed workout: Id, UserId, StartedAt, CompletedAt, Notes, TemplateId (nullable), SessionExercises |
| **SessionExercise** | Exercise within a session: WorkoutSessionId, ExerciseId, OrderIndex, Notes, Sets (collection) |
| **ExerciseSet** | Individual set: SessionExerciseId, SetNumber, WeightKg, Reps, RepsInReserve (RIR), RPE, SetType (enum), CompletedAt, DurationSeconds |
| **TrainingProgram** | Multi-week plan: Id, UserId, Name, DurationWeeks, GoalDescription, Weeks (collection), GeneratedByAI (bool), AiReasoning |
| **ProgramWeek** | A week within a program: TrainingProgramId, WeekNumber, VolumeMultiplier, DeloadWeek (bool), Days (collection) |
| **ProgramDay** | A day's prescription: ProgramWeekId, DayOfWeek (enum), WorkoutTemplateId (nullable), RestDay (bool), Focus (string) |
| **BodyMeasurement** | Progress tracking: Id, UserId, RecordedAt, WeightKg, BodyFatPercent, MuscleKg, MeasurementNotes, Photos (list of path) |
| **AiConversation** | Chat history with AI coach: Id, UserId, StartedAt, Messages (collection), Context (json), ProgramGenerated (bool) |
| **AiMessage** | Single message: ConversationId, Role (enum: User/Assistant/System), Content, Timestamp, TokensUsed |

### 3.2 Key Enumerations

Define all enums in `RepWizard.Core.Enums`. Every enum value must have an `[EnumMember(Value=...)]` and a `[Description(...)]` attribute for display binding.

| Enum | Values |
|---|---|
| **FitnessGoal** | StrengthGain, MuscleHypertrophy, FatLoss, GeneralFitness, Endurance, PowerAndAthletics, Rehabilitation |
| **ExperienceLevel** | Beginner (0–6 months), Novice (6–18 months), Intermediate (1.5–3 years), Advanced (3–5 years), Elite (5+ years) |
| **ExerciseCategory** | Strength, Cardio, Flexibility, Balance, Power, Rehabilitation, Warmup, Cooldown |
| **Equipment** | Barbell, Dumbbell, Machine, Cable, Bodyweight, Kettlebell, Bands, TRX, None |
| **SetType** | Warmup, Working, Dropset, FailureSet, ForceRep, NegativeOnly, IsometricHold |
| **ProgressionRule** | LinearLoad, DoubleProgression, RPEBased, PercentageOfMax, Autoregulated, Deload |
| **MuscleGroup** | Chest, Back, Shoulders, Biceps, Triceps, Forearms, Quads, Hamstrings, Glutes, Calves, Core, FullBody, Traps, Lats |

---

## 4. REST API Specification

The API is hosted in `RepWizard.Api` (ASP.NET Core Minimal APIs, .NET 9). All endpoints return `application/json`. Versioning via URL prefix: `/api/v1/`. All endpoints require JWT bearer auth except `/api/v1/auth/*`. Use endpoint groups, not controllers.

### 4.1 Endpoint Groups

| Endpoint Group | Key Routes |
|---|---|
| **Auth** | POST /auth/register, POST /auth/login, POST /auth/refresh |
| **Users** | GET /users/{id}, PUT /users/{id}/profile, GET /users/{id}/stats |
| **Exercises** | GET /exercises (paginated, filtered), GET /exercises/{id}, POST /exercises, PUT /exercises/{id} [admin] |
| **Workouts** | POST /workouts/sessions (start), PUT /workouts/sessions/{id} (log set), POST /workouts/sessions/{id}/complete |
| **Templates** | GET /templates, POST /templates, GET /templates/{id}, PUT /templates/{id}, DELETE /templates/{id} |
| **Programs** | GET /programs, GET /programs/{id}, POST /programs/generate (AI), PUT /programs/{id}, DELETE /programs/{id} |
| **Measurements** | GET /measurements, POST /measurements, GET /measurements/progress-chart |
| **AI Coach** | POST /ai/chat (streaming SSE), POST /ai/analyze-progress, POST /ai/generate-program, GET /ai/conversations, GET /ai/conversations/{id} |
| **Sync** | POST /sync/push (client → server), GET /sync/pull?since={timestamp} |

### 4.2 API Response Envelope

All API responses use a consistent envelope. Never return naked objects from endpoints.

```json
{
  "success": true,
  "data": { },
  "message": null,
  "errors": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 150,
    "totalPages": 8
  }
}
```

### 4.3 AI Streaming Endpoint

`POST /api/v1/ai/chat` must support Server-Sent Events (SSE) for streaming responses from Claude. The MAUI client connects via `HttpClient` and reads the stream in chunks, updating the UI in real time. Include a cancellation token wired to the user dismissing the response.

> ⚠️ **Critical Implementation Note:** The prior RepWizard TypeScript iteration had memory leak issues with HTTP connections. In the .NET API, always use `IHttpClientFactory`. In MAUI, use a named HttpClient registered via `MauiProgram.cs`:
> ```csharp
> builder.Services
>     .AddHttpClient("RepWizardApi", c => { c.BaseAddress = new Uri(config["ApiBaseUrl"]); })
>     .AddStandardResilienceHandler();
> ```
> Never create raw `HttpClient` instances. The SSE stream should be read with `ReadAsStreamAsync` and wrapped in a `StreamReader`, closed on cancellation.

---

## 5. MAUI Client Specification

### 5.1 Navigation Structure

Use Shell navigation throughout. Define routes in `AppShell.xaml`. The app has three tab-bar sections for authenticated users: **Today** (active workout / next session), **Progress** (history, charts, measurements), and **Coach** (AI chat, programs, library).

| Shell Route | ViewModel / Purpose |
|---|---|
| `//today` | TodayViewModel — shows today's scheduled workout or prompts to start a session |
| `//today/active-session` | ActiveSessionViewModel — gym-floor logging UI (primary interaction surface) |
| `//today/exercise-detail/{id}` | ExerciseDetailViewModel — exercise info + history |
| `//progress` | ProgressViewModel — workout history list + calendar heatmap |
| `//progress/session/{id}` | SessionDetailViewModel — review completed session |
| `//progress/charts` | ChartsViewModel — strength curves, volume over time, body composition |
| `//progress/measurements` | MeasurementsViewModel — log and view body stats |
| `//coach` | CoachViewModel — AI chat interface |
| `//coach/programs` | ProgramsViewModel — view/manage training programs |
| `//coach/program/{id}` | ProgramDetailViewModel — week-by-week program view |
| `//coach/library` | ExerciseLibraryViewModel — browse/search exercise database |
| `//settings` | SettingsViewModel — profile, sync, notifications |

### 5.2 Active Session UI — Critical Requirements

This is the most-used surface of the app — it must be fast, usable one-handed, and work offline. Design for gym-floor use: large touch targets (min 48dp), minimal scrolling, and no network dependencies for set logging.

- Sets are logged inline with a swipe-to-complete gesture; tapping a set row opens a compact number entry sheet.
- Weight and rep fields remember last session values and populate as defaults (progressive overload assistance).
- RPE (Rate of Perceived Exertion, 1–10) and RIR (Reps in Reserve, 0–4+) fields are optional but surfaced prominently.
- Rest timer fires automatically after completing a set, with configurable duration per exercise and a pop-up countdown.
- Superset support: allow grouping exercises; sets alternate between grouped exercises.
- Session can be paused (app background) and resumed; state persists to SQLite immediately on every set completion.
- **Offline-first: zero API calls during an active session.** Sync happens on session completion.

### 5.3 MVVM Guidelines

- All ViewModels inherit `ObservableObject` from `CommunityToolkit.Mvvm`.
- Use `[ObservableProperty]` and `[RelayCommand]` source generators — no manual `INotifyPropertyChanged` boilerplate.
- ViewModels receive all dependencies via constructor injection; no service locator / `static App.Current` access.
- Navigation is performed through an `INavigationService` abstraction injected into ViewModels — not called from code-behind.
- No `async void` except event handlers. All async operations use `CancellationTokenSource` and are cancellable.
- Loading, error, and empty states are explicit `ObservableProperty` booleans on every ViewModel (`IsLoading`, `HasError`, `ErrorMessage`, `IsEmpty`).

---

## 6. AI Coach Feature Specification

### 6.1 Overview

The AI Coach is the differentiating feature of RepWizard. It is powered by Claude (Anthropic) via the official .NET SDK and operates as a knowledgeable, evidence-based personal trainer. The AI must ground every recommendation in exercise science and, where possible, cite peer-reviewed research or established methodologies. It must not give generic advice or simply repeat what the user says back to them.

### 6.2 System Prompt — AI Coach Persona

The following system prompt must be injected as the first message in every new AI conversation. Store it in a configuration file (`appsettings.json` or a dedicated `PromptTemplates.cs`), never hardcode it inline. It must be version-controlled and updatable without redeployment.

```
You are RepWizard Coach, an evidence-based strength and conditioning specialist
with deep expertise in:

  - Resistance training periodization (linear, undulating, block, conjugate)
  - Hypertrophy science (MEV/MAV/MRV framework, Dr. Mike Israetel's RP methodology)
  - Neurological fatigue and CNS load management
  - Progressive overload strategies (load, volume, frequency, density, technique)
  - Appropriate training volume per muscle group per week (sets-per-week landmarks)
  - Recovery, sleep, and nutrition's interaction with training adaptation
  - Injury prevention, movement screening, and corrective exercise
  - Evidence-based stretching (dynamic pre-workout, PNF / static post-workout)
  - Deload protocols and managing accumulated fatigue

BEHAVIOR RULES:

 1. Always ground recommendations in exercise science. When relevant, reference the
    underlying principle (e.g. 'stimulus-fatigue ratio', 'mechanical tension',
    'metabolic stress').

 2. When the user asks for a program or plan, ask clarifying questions about their
    goal, current training age, available equipment, and weekly availability before
    generating.

 3. Cite specific research frameworks when making claims (e.g., 'Per Schoenfeld's
    2017 meta-analysis on training frequency...' or 'The RP weekly volume landmarks
    suggest...'). Do not fabricate citations.

 4. Never generate a program without knowing: goal (strength/hypertrophy/fat loss/
    general fitness), experience level, days per week, session duration, and
    equipment.

 5. Flag CNS-intensive periods. When a program includes heavy neural-demand exercises
    (max strength, Olympic lifts, plyometrics), explicitly note CNS loading and
    recovery needs.

 6. Include a deload every 4–8 weeks. Explain why and provide a specific deload
    prescription (50–60% volume, same or reduced intensity).

 7. Differentiate between strength adaptations (lower rep, longer rest, higher
    intensity) and hypertrophy adaptations (moderate rep ranges 6–20, moderate rest,
    higher weekly volume).

 8. When providing stretching guidance: prescribe dynamic mobility pre-session (not
    static, which acutely reduces force output); prescribe static/PNF stretching
    post-session for flexibility goals.

 9. Be direct and specific. Avoid hedge language like 'it depends' without
    immediately explaining what it depends on and giving a concrete recommendation.

10. When the user shares their workout log, analyze it for: progression trends,
    potential overtraining signals, muscle group balance, and adherence.
```

### 6.3 AI Context Injection

Every AI API call must inject structured context about the user's current state. This context is built by the `AiContextBuilder` service in `RepWizard.Application` and serialized as a JSON block appended to the system message.

| Context Field | Source |
|---|---|
| `user.goal` | User.FitnessGoal enum value + description |
| `user.experience` | User.ExperienceLevel enum value |
| `user.age` | Calculated from User.DateOfBirth |
| `user.weightKg` | Latest BodyMeasurement.WeightKg |
| `recentWorkouts` | Last 14 days of WorkoutSession summaries (date, template name, total volume) |
| `currentProgram` | Active TrainingProgram name, current week, next scheduled session |
| `volumeLandmarks` | Per-muscle MEV/MAV/MRV estimates based on experience level |
| `weeklyVolume` | Actual sets-per-muscle-group for the past 7 days vs. targets |
| `progressionTrends` | Key lifts: 3-month rolling trend for top 3 exercises (% change) |
| `fatigueIndicators` | Days since last rest, session frequency last 7 days, average RPE last week |

### 6.4 Program Generation Workflow

When the user requests a training program, the flow is:

1. User initiates via `/coach/programs` screen or AI chat with intent like "create me a program".
2. AI Coach asks a structured set of clarifying questions (goal, days/week, session length, equipment, weak points, injury history).
3. Once all required information is gathered, `POST /api/v1/ai/generate-program` is called with the conversation ID.
4. The API builds a full context package and streams a structured program response back via SSE.
5. The program response must be parseable into a `TrainingProgram` entity. Use a two-phase approach: first stream to UI, then parse and persist.
6. The generated `TrainingProgram` is saved to the database with `GeneratedByAI=true` and the `AiReasoning` field populated.
7. The user can edit any aspect of the generated program before activating it.
8. Once activated, the program populates the **Today** tab with scheduled sessions.

### 6.5 Science-Based Constraints the AI Must Enforce

These rules are enforced in the program generation pipeline, not just suggested to the AI. Build a `ProgramValidator` that checks generated programs against these constraints and flags violations.

- Weekly volume per muscle group must not exceed MRV for the user's experience level: Beginners 10–12 sets/muscle/week max, Intermediate 16–20, Advanced 22+ with caution.
- Minimum 48 hours between sessions targeting the same primary muscle group (72 hours preferred for beginners).
- Programs of 4+ weeks must include at least one deload week (50–60% volume reduction, same or slightly reduced intensity).
- No more than 2 consecutive days of high-CNS-demand training (heavy compounds at 85%+ 1RM, plyometrics, Olympic lifts).
- Beginners: 3 full-body sessions/week max to prioritize motor learning over split training.
- Hypertrophy programs must include sets in the 6–20 rep range, with most working sets in 8–15. Strength programs: 1–6 rep range for primary lifts.
- Warm-up sets are prescribed, not optional — at minimum 2 ramp-up sets before working sets on compound movements.
- Stretching is always prescribed: dynamic mobility in warm-up (leg swings, arm circles, band pull-aparts, etc.); static/PNF in cool-down if flexibility is a goal.

---

## 7. Data Layer

### 7.1 Database Strategy

The app uses a dual-database strategy. The MAUI client has a local SQLite database (`RepWizard.db`) managed by EF Core. The server API connects to PostgreSQL. They share the same EF Core schema (same `DbContext` base class, different provider configuration). Migrations are managed server-side; the mobile client uses `EnsureCreated` + a lightweight schema version check.

### 7.2 Repository Pattern

Define generic and specific repository interfaces in `RepWizard.Core.Interfaces`. Implement in `RepWizard.Infrastructure`.

```csharp
IRepository<T> : IReadRepository<T>, IWriteRepository<T>

IReadRepository<T>
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<IReadOnlyList<T>> GetAllAsync(CancellationToken ct);
    Task<IReadOnlyList<T>> GetBySpecAsync(ISpecification<T> spec, CancellationToken ct);
}

IWriteRepository<T>
{
    Task AddAsync(T entity, CancellationToken ct);
    void Update(T entity);
    void Delete(T entity);
    Task<int> SaveChangesAsync(CancellationToken ct);
}
```

- Use the Specification pattern for complex queries — no LINQ in ViewModels or Services.
- Soft deletes: filter on `IsDeleted` in a global query filter in the `DbContext`.
- All audit fields (`CreatedAt`, `UpdatedAt`) are populated in the `SaveChangesAsync` override.

### 7.3 Offline Sync

Every entity has a `SyncState` enum (`New`, `Modified`, `Synced`, `Conflict`) and a `LastSyncedAt` timestamp. A background `ISyncService` runs on app resume and on explicit user trigger. Conflict resolution defaults to server-wins with local copy preserved in a `ConflictLog`.

---

## 8. Exercise Library Seeding

The API project must seed a foundational exercise library on first run. Seed data must be defined as JSON files in `RepWizard.Api/Data/Seeds/exercises.json`. Minimum required exercises at launch:

| Category | Required Seed Exercises |
|---|---|
| **Chest** | Barbell Bench Press, Incline DB Press, Cable Fly, Dip, Push-Up variations |
| **Back** | Barbell Row, Pull-Up/Chin-Up, Seated Cable Row, Single-Arm DB Row, Lat Pulldown, Face Pull |
| **Shoulders** | Overhead Press (barbell + DB), Lateral Raise, Rear Delt Fly, Arnold Press, Cable Lateral |
| **Legs** | Barbell Squat, Romanian Deadlift, Leg Press, Leg Curl, Leg Extension, Walking Lunge, Hip Thrust, Calf Raise |
| **Deadlifts** | Conventional Deadlift, Sumo Deadlift, Trap Bar Deadlift, Stiff-Leg Deadlift |
| **Arms** | Barbell Curl, Hammer Curl, Tricep Pushdown, Skull Crusher, Close-Grip Bench, Preacher Curl |
| **Core** | Plank variations, Dead Bug, Ab Wheel Rollout, Hanging Leg Raise, Cable Crunch, McGill Big 3 |
| **Mobility/Stretching** | Hip Flexor Stretch, Pigeon Pose, Thoracic Rotation, Band Pull-Apart, World's Greatest Stretch, 90/90 Hip |
| **Cardio** | Treadmill, Rower, Assault Bike, Jump Rope, Stair Climber |

Each exercise in the seed must include: `name`, `description`, `category`, `primaryMuscles` (array), `secondaryMuscles` (array), `equipment`, `difficulty`, `isCompound`, and `instructions` (numbered list of steps). Include `ResearchNotes` where applicable (e.g., for squat: reference to Schoenfeld on squat depth; for bench: note on shoulder positioning).

---

## 9. Testing Requirements

Minimum test coverage expectations for the initial build. All tests live in `RepWizard.Tests`.

| Test Area | Required Coverage |
|---|---|
| **Domain Entities (Core)** | Unit tests for all entity business rules, enum validation, computed properties |
| **Use Case Handlers (Application)** | Unit test every MediatR command/query handler with mocked repositories |
| **Program Validator** | Unit tests for every science-based constraint rule (section 6.5) |
| **AI Context Builder** | Unit tests verifying correct context construction from mock user data |
| **Repository (Infrastructure)** | Integration tests using SQLite in-memory provider |
| **API Endpoints** | Integration tests using WebApplicationFactory for critical endpoints |
| **Sync Logic** | Unit tests for conflict detection and resolution logic |

Use `FluentAssertions` for all assertions. Arrange-Act-Assert structure enforced. No logic in test helpers — each test must be independently readable.

---

## 10. Implementation Roadmap — Phased Build Order

To avoid the pattern of prior iterations (starting broad and abandoning), follow this strict phase-gate approach. **Do not start Phase N+1 until Phase N is complete and tests pass.**

### Phase 1 — Foundation *(Target: Runnable skeleton)*

1. Create solution structure with all 8 projects, correct project references, and no circular dependencies.
2. Implement `BaseEntity`, all Core entities, all enums with attributes.
3. Set up EF Core `DbContext` in Infrastructure with SQLite provider.
4. Generate and apply initial migration.
5. Implement generic `Repository<T>` and verify with integration tests.
6. Bootstrap MAUI App with Shell navigation skeleton (empty pages for all routes).
7. Bootstrap ASP.NET Core API with OpenAPI endpoint and health check.
8. Write entity unit tests (all pass).

### Phase 2 — Workout Logging *(Target: Log a set in the app)*

1. Implement exercise library endpoints + seed data.
2. Implement WorkoutSession start/log/complete endpoints.
3. Build `ActiveSessionViewModel` and `ActiveSessionPage` with offline SQLite writes.
4. Rest timer, progressive overload defaults, RIR/RPE fields.
5. Offline sync: implement `SyncService` stub that pushes sessions on completion.
6. Write handler tests for all workout commands/queries.

### Phase 3 — Progress & History

1. Implement session history list + `SessionDetailPage`.
2. Implement body measurement logging.
3. Implement progress charts (strength curves, volume trends, body composition).
4. Implement exercise PR tracking.

### Phase 4 — AI Coach

1. Implement Anthropic SDK integration in API with streaming SSE endpoint.
2. Implement `AiContextBuilder` service.
3. Build `CoachPage` with streaming chat UI.
4. Implement program generation workflow (section 6.4 full flow).
5. Implement `ProgramValidator` with all science-based constraints.
6. Build program detail view and session scheduling into Today tab.
7. Write AI context builder and program validator tests.

### Phase 5 — Polish & Cross-Platform

1. Adaptive layouts for tablet and desktop (Windows/macOS).
2. Dark mode support with proper resource dictionary theming.
3. Notification service for rest timers and scheduled workout reminders.
4. Authentication (JWT, profile management).
5. Full sync conflict resolution UI.
6. App store packaging and CI pipeline.

---

## 11. Anti-Patterns — Lessons from Prior Iterations

The following patterns have caused abandonment of previous iterations. Each item is a direct lesson learned. Treat this as a checklist to be reviewed at every phase gate.

> ❌ **Do Not Repeat These Mistakes**

1. **Scope creep before the core loop works.** Do not add AI features before a set can be logged and reviewed. Core loop first.
2. **Anemic domain model.** Entities must contain business logic. Do not put all logic in services and have entities be pure data bags.
3. **Raw HttpClient instantiation.** This caused real memory leak production issues. Always use `IHttpClientFactory`.
4. **Exception-driven flow.** Catch exceptions at the boundary only. Use `Result<T>` for expected failure states.
5. **God ViewModels.** If a ViewModel exceeds 300 lines, it's doing too much. Extract to sub-ViewModels or separate services.
6. **Skipping tests to go faster.** Every phase gate has required tests. Do not proceed without them.
7. **Platform-specific UI logic in shared code.** Use partial classes or platform-specific service implementations.
8. **Ignoring offline-first from the start.** Adding sync retroactively is extremely painful. Design for offline from day 1.
9. **Single flat database for client and server.** Use the dual-database strategy defined in section 7.
10. **AI prompt as static string.** System prompts and context templates must be externalized and version-controlled.

---

## 12. Quick-Start Instructions for the AI

When using this prompt with an AI coding assistant (Claude, Copilot, etc.), begin with the following starter message:

> **Starter Message Template:**
>
> "I am building RepWizard as described in the attached specification document. Please start with Phase 1 of the implementation roadmap. For each step, generate the complete, runnable code — do not use placeholder comments or TODOs. Follow all architectural decisions in Section 2 strictly. After completing each step, confirm what was built before proceeding to the next. If you identify any inconsistencies in the spec, flag them before writing code, do not silently resolve them."

**Additional guidance for AI sessions:**

- Work one phase at a time. Ask for the next phase explicitly.
- Request code reviews at phase gates before moving on.
- Ask the AI to explain its reasoning when it deviates from the spec.
- Use Claude for the AI Coach system prompt work — it is self-referential and Claude understands its own capabilities.
- Keep a running `CHANGELOG.md` as the build progresses.

---

## 13. UI Design System — Material 3 Expressive (M3E)

### 13.1 Design Vision

RepWizard's UI must feel **kinetic, motivating, performance-focused, and premium** — like high-end fitness hardware, not a SaaS analytics dashboard. This is a **training command center**, not a card-based dashboard.

| Priority | Goal |
|---|---|
| 1 | Instant usability |
| 2 | Clear primary action at all times |
| 3 | Performance feedback that feels rewarding |
| 4 | Expressive motion and depth — restrained, not decorative |

### 13.2 Core Experience Principles

**Motion-First, Not Card-First.** Avoid stacked card dashboards. Use layered tonal surfaces and meaningful motion. Motion must communicate state change, confirmation, hierarchy, or progress. If motion is decorative → remove it.

**Athlete Feedback Loop.** The UI must communicate the user's current training state:

| Training State | Emotional Target |
|---|---|
| No active workout / streak | Potential energy — ready to go |
| Active streak / in-progress week | Momentum / heat |
| Workout just completed | Reward / power |

**Command Center Mental Model.** Replace static dashboards with a central performance visualization, supporting instrumentation metrics, and one dominant primary action. Nothing competes with the primary CTA.

### 13.3 Information Hierarchy (Strict)

Visual priority order — enforce this in every layout decision:

1. **Start Workout** (Primary CTA) — must be instantly findable by a half-awake user
2. **Weekly Progress Visualization** — understood at a glance
3. **Weekly Goal Context** — supporting the visualization
4. **Secondary Metrics** — instrumentation, not emphasis
5. **Navigation** — present but subordinate

If anything competes visually with #1 or #2 → reduce or remove it.

### 13.4 Layout Grid & Screen Zones

Use the **Material 3 baseline 4pt grid** throughout.

| Zone | Position | Purpose |
|---|---|---|
| Top System Safe Area | System-managed | Status bar clearance |
| Context Header Band | Top 10–15% | Date, greeting, optional readiness indicator |
| Hero Performance Zone | Center ~40% | Circular progress + primary CTA |
| Weekly Status Band | Below hero | Goal strip, streak indicator |
| Metrics Instrumentation Zone | Lower third | 2×2 grid or chip row of secondary stats |
| Bottom Navigation Safe Area | Bottom | Navigation bar |

### 13.5 Home Screen Component Specifications

#### A. Context Header (Top 10–15%)
- **Content:** Date label, username/greeting, optional readiness indicator
- **Style:** Tonal surface container, low elevation, no card containers
- **Motion:** Subtle fade-in on screen entry only

#### B. Hero Performance Zone (Center ~40%)
The visual anchor of the entire app.

- **Component:** Expressive Circular Progress Container
- **Shape:** Morphable circle container with tonal elevation shadow (no drop shadow card)
- **Progress Indicator:** Expressive arc with gradient stroke
- **Content displayed:** Percentage complete, "Weekly Complete" label, workout count (e.g., "0 / 4 workouts")
- **Allowed expression:** Gradient progress stroke, subtle highlight sweep every ~6s, soft inner glow
- **Forbidden:** Floating particles, animated backgrounds, large glow blobs, decorative grids

#### C. Primary Action — Start Workout (Non-Negotiable)
This button must be the highest-elevation, most visually dominant element on screen at all times.

- **Component:** Extended FAB (Expressive) OR Full-Width Tonal Button
- **Label:** `START WORKOUT`
- **Placement:** Bottom of hero zone OR top of lower third
- **Corner radius:** 28–36dp (expressive, not pill, not square)
- **Elevation:** Highest on screen

**Motion behavior:**

| Trigger | Behavior |
|---|---|
| Idle | Slow breathing scale: 1.00 → 1.02 → 1.00 every 6–8 seconds |
| Press | Scale to 0.96, elevation drop, morph transition into workout screen |
| Post-workout | Brief tertiary color pulse, then return to normal |

#### D. Weekly Status Strip (10–15%)
- **Contains:** Weekly goal progress, streak indicator, optional next scheduled workout
- **Style:** Tonal surface, hairline divider only
- **Rule:** No cards, no floating UI objects

#### E. Secondary Metrics Zone
- **Layout:** 2×2 grid OR horizontal chip row
- **Metrics to display:** Workouts this week, Minutes trained, Total Volume, Streak
- **Component:** Expressive Metric Chips — tonal fill, icon left, large number right
- **Motion:** Number roll animation **only** when values change. No idle animation.

#### F. Navigation
- **System:** Material 3 Expressive Bottom Navigation only — one navigation system, no dual nav
- **Active destination indicator:** Pill indicator with tonal color shift + icon micro-scale on selection
- **Forbidden:** Floating glass nav bars, dual navigation models, floating shortcut icons above nav bar

### 13.6 Color System

| Role | Usage |
|---|---|
| **Primary** | Main actions + progress arc highlight |
| **Secondary** | Supporting emphasis (metric chips, labels) |
| **Tertiary** | Achievement, streak, completion celebration |
| **Surface** | Background layers, tonal containers |

**Post-completion color behavior:** On workout completion, trigger a temporary tertiary color pulse on the progress ring with saturation increase of +8–12% for less than 1 second, then return to normal. No persistent color changes.

### 13.7 Motion System

All motion must serve one of these purposes: state change, confirmation, hierarchy clarity, or progress feedback. Decorative motion is prohibited.

| Event | Duration Target |
|---|---|
| Tap / press feedback | 120–180ms |
| Screen transition | 250–350ms |
| Completion celebration burst | 600–900ms |
| Progress arc update | Easing curve, not instant |
| Number increment | Inertia count-up animation |

**Streak indicator:** Subtle flicker or glow tied to streak length. Number inertia count-up on value change.

**Reduce Motion compliance:** All animations must respect the OS-level "Reduce Motion" accessibility setting. Provide non-animated fallbacks for every motion behavior defined above.

### 13.8 Active Session Screen — Additional UI Requirements

The Active Session screen (route `//today/active-session`) has its own motion and layout requirements layered on top of the general spec:

- Transition from home screen into active session must use the morph transition from the Start Workout button — the button should visually expand into the session screen container.
- Set completion must trigger a brief confirmation microinteraction (haptic + visual scale pulse on the completed row).
- Rest timer is a persistent bottom sheet or overlay with a large countdown arc using the same expressive arc component as the hero zone — visual language consistency.
- Exercise swap / reorder must use fluid drag-and-drop with lift elevation animation (M3 drag elevation: +6dp on lift).
- On session complete, trigger the full tertiary celebration sequence (arc fills, color pulse, completion card morphs in from below).

### 13.9 Accessibility Requirements

- **Contrast:** WCAG AA minimum on all text and interactive elements
- **Progress communication:** Never conveyed by color alone — always paired with label or numeric value
- **Reduce Motion:** Full compliance — all motion has a non-animated equivalent
- **Touch targets:** Primary action reachable in single-thumb zone (bottom 60% of screen on phones); minimum 48dp touch targets throughout
- **Text scaling:** All layouts must support Dynamic Type / font scaling without truncation or overflow

### 13.10 Design Anti-Pattern Block List

The following patterns are **explicitly rejected**. If an AI generator or developer produces any of these, it must be flagged and rebuilt:

- ❌ Stacked card dashboards
- ❌ Floating metric bubbles
- ❌ Decorative background grids or animated background textures
- ❌ Dual navigation systems (tab bar + bottom nav simultaneously, or nav rail + bottom nav)
- ❌ Glass morphism floating nav bars
- ❌ Multiple glowing primary elements competing for attention
- ❌ Multiple simultaneous primary CTAs
- ❌ Concept-art aesthetics (gaming HUD, crypto trading UI, Dribbble-only designs)
- ❌ Idle animations on secondary metrics or decorative elements

### 13.11 Heuristic Validation Test

Before any screen is considered complete, apply this test: *If a user opens the app half-awake before a morning workout, can they:*

1. Find and tap **Start Workout** without thinking?
2. Understand their weekly progress without reading anything carefully?
3. Ignore all decorative elements without confusion?

If the answer to any of these is "not immediately" → simplify the layout before shipping.

**Target balance:** 60% product clarity, 40% expressive energy. Not 70% concept art / 30% usable product.

### 13.12 MAUI Implementation Notes

Translating M3E to .NET MAUI requires these specific implementation decisions:

- Use `GraphicsView` with `SkiaSharp` (via `SkiaSharp.Views.Maui`) for the hero circular progress arc — native MAUI shapes cannot produce the gradient stroke + glow required.
- The breathing scale animation on the Start Workout button uses `ScaleXTo` / `ScaleYTo` in a looping `Animation` object — not `ViewExtensions` (which don't loop cleanly).
- Tonal surface containers map to MAUI `Border` with `StrokeShape=RoundRectangle` and background color bound to the M3 surface color token.
- Expressive Metric Chips are custom `ContentView` controls — define once in `RepWizard.UI/Controls/MetricChipView.xaml` and reuse.
- Bottom Navigation maps to MAUI Shell `TabBar` with custom `ShellTabBarAppearance` — the active pill indicator requires a custom `TabBar` renderer or handler override per platform.
- Respect `AccessibilitySettings.IsReduceMotionEnabled` (iOS) and `Settings.Global.TRANSITION_ANIMATION_SCALE` (Android) via platform-specific service accessed through `IMotionPreferenceService` abstraction in Core.

---

*RepWizard Build Prompt — Synthesized from RepWizard, RepWizard-MAUI, and ExerciseTracker repositories — 2026*
