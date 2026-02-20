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

*Phase 2 — Workout Logging* is the next phase gate.
*Prerequisites: exercise library endpoints, WorkoutSession CRUD, ActiveSessionPage with offline logging.*
