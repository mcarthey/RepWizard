# RepWizard — Claude Code Instructions

## Project Overview

RepWizard is a .NET 9 MAUI workout tracking mobile app using Clean Architecture (8 projects). Offline-first with SQLite on mobile, SQL Server LocalDB for the API server.

## Quick Reference

- **Solution**: `RepWizard.sln` (8 projects)
- **API**: `RepWizard.Api` — ASP.NET Core Minimal APIs on https://localhost:7001
- **MAUI App**: `RepWizard.App` — Shell-based navigation, 3 tabs (Today, Progress, Coach)
- **SDK pinned**: `global.json` pins to .NET 9.0.x — do not remove
- **Tests**: `dotnet test` from repo root (146 passing as of Phase 3)

## Architecture Rules (MUST follow)

- **Clean Architecture**: Core → Shared → Application → Infrastructure → Api/App. Never skip layers.
- **CQRS via MediatR**: All data operations go through Commands/Queries. ViewModels and endpoints call `IMediator.Send()` — never call repositories directly.
- **Result\<T\>**: No exception-driven control flow. Return `Result<T>.Success()` or `Result<T>.Failure()`.
- **Offline-first**: All writes during a workout go to local SQLite. Zero API calls during active session.
- **No raw HttpClient**: Always use `IHttpClientFactory`. Socket exhaustion is a known prior issue.
- **No Shell.Current in ViewModels**: Use `INavigationService` abstraction.
- **ViewModel max 300 lines**: Extract to sub-ViewModels if exceeded.
- **No anemic domain models**: Business logic belongs on entities, not in services.

## Project Structure

```
RepWizard.Core           — Domain entities, interfaces, enums (no dependencies)
RepWizard.Shared         — DTOs, API contracts (shared client/server)
RepWizard.Application    — CQRS commands/queries, MediatR handlers, FluentValidation
RepWizard.Infrastructure — EF Core DbContext, repositories, services
RepWizard.Api            — ASP.NET Core API host, endpoint groups
RepWizard.App            — MAUI shell, DI wiring, platform entry points
RepWizard.UI             — XAML pages, controls, ViewModels (MVVM)
RepWizard.Tests          — xUnit tests
```

## Database Configuration

- **MAUI client**: SQLite at `LocalApplicationData/RepWizard.db`
- **API server (dev)**: SQL Server LocalDB — connection string in `appsettings.Development.json`
- **DI methods**: `AddInfrastructureSqlite(path)`, `AddInfrastructureSqlServer(config)`, `AddInfrastructurePostgres(config)`

## Running Locally

```bash
# Terminal 1 — API
cd RepWizard.Api && dotnet run --launch-profile https

# Terminal 2 — Android emulator
dotnet build RepWizard.App/RepWizard.App.csproj -f net9.0-android -t:Run -p:AndroidAttachDebugger=false

# Do NOT use adb install — use dotnet build -t:Run for Fast Deployment
```

## Current Status (Phase 3 Complete)

### What's implemented and working:
- All 13 domain entities with business logic
- Full CQRS layer (4 commands, 8 queries, validators, pipeline behaviors)
- 12 API endpoints (health, exercises, workouts, measurements)
- 146 passing tests
- Offline-first workout logging (SQLite)
- ProgressPage, SessionDetailPage, MeasurementsPage, ChartsPage — fully functional
- TodayPage — layout works, shows placeholder data (not wired to real queries)

### What's a stub (exists but placeholder UI):
- **ActiveSessionPage** — ViewModel (`ActiveSessionViewModel`) is FULLY implemented (LogSetAsync, CompleteSessionAsync, rest timer, progressive overload defaults), XAML is 20-line placeholder that needs a complete workout logging UI
- CoachPage, ProgramsPage, ProgramDetailPage, ExerciseLibraryPage, ExerciseDetailPage, SettingsPage — all stub placeholders

### What's not started:
- Phase 4: AI Coach (Anthropic SDK, SSE streaming, program generation)
- Phase 5: Auth, real sync, notifications, polish

## Key Documentation

- `docs/IMPLEMENTATION.md` — Master specification (667 lines) — the authoritative source for all features
- `docs/TASKS.md` — Phase tracker with checkboxes — update this as tasks are completed
- `docs/ARCHITECTURE.md` — Architecture reference
- `docs/STARTUP.md` — How to run locally

## Common Tasks

### Adding a new CQRS command:
1. Create folder: `RepWizard.Application/Commands/{Domain}/{CommandName}/`
2. Add: `{CommandName}Command.cs`, `{CommandName}CommandHandler.cs`, `{CommandName}CommandValidator.cs`
3. Handler returns `Result<TDto>`, validator uses FluentValidation
4. Add endpoint in `RepWizard.Api/Endpoints/`
5. Add tests in `RepWizard.Tests/`

### Adding a new page:
1. Create XAML + code-behind in `RepWizard.UI/Pages/`
2. Create ViewModel in `RepWizard.UI/ViewModels/`
3. Register both in `RepWizard.App/MauiProgram.cs` DI
4. Register route in `RepWizard.App/AppShell.xaml.cs`

### Building for Android:
```bash
dotnet build RepWizard.App/RepWizard.App.csproj -f net9.0-android -c Debug
```

## Conventions

- Commit messages: `feat:`, `fix:`, `chore:`, `ci:` prefixes
- Test assertions: FluentAssertions only
- All tests must pass before marking a phase complete
- Update `docs/TASKS.md` when completing tasks
- Create logical, well-organized git commits — group related changes together

## Known Build Issues

- `MotionPreferenceService` platform files need `#if IOS || MACCATALYST` / `#if ANDROID` guards
- `Application` namespace collision: use `Microsoft.Maui.Controls.Application` in App.xaml.cs
- SQL Server doesn't allow multiple cascade delete paths — use `DeleteBehavior.NoAction`
- Android deployment: MUST use `dotnet build -t:Run`, NOT `adb install` (Fast Deployment)
- Some icon image files referenced in TodayPage (`icon_workouts.png`, `icon_time.png`, `icon_volume.png`, `icon_streak.png`) don't exist yet — non-critical but should be created as simple SVG/PNG assets

---

## NEXT STEPS — Implementation Priority

**Read `docs/IMPLEMENTATION.md` and `docs/TASKS.md` before starting.** The IMPLEMENTATION.md is the master spec. TASKS.md tracks what's done and what's pending.

### Priority 1: Complete Phase 3 Gaps (finish what's partially done)

#### 1a. Build ActiveSessionPage XAML (highest impact)
The `ActiveSessionViewModel` at `RepWizard.UI/ViewModels/ActiveSessionViewModel.cs` is fully implemented with:
- `LogSetCommand` (offline SQLite write, no API)
- `CompleteSessionCommand` (marks complete, triggers sync)
- Rest timer with countdown
- Progressive overload defaults from `GetLastSessionDefaultsQuery`

The `ActiveSessionPage.xaml` at `RepWizard.UI/Pages/ActiveSessionPage.xaml` is a 20-line stub. It needs:
- Exercise picker/selector (load from exercise library)
- Set input form: Weight (kg), Reps, RPE (1-10 slider), RIR (optional), SetType dropdown
- Pre-fill fields with progressive overload defaults from last session
- List of logged sets per exercise (CollectionView)
- Rest timer display with countdown arc and "Skip" button
- Session elapsed time display
- "Complete Session" button
- Session notes text input
- Follow M3E design system (use existing styles from `Styles.xaml` and `Colors.xaml`)

#### 1b. Wire TodayViewModel to real data
`TodayViewModel` at `RepWizard.UI/ViewModels/TodayViewModel.cs` lines 69-76 uses hardcoded zeros. Wire it to:
- `GetSessionHistoryQuery` — count this week's sessions for `WorkoutsThisWeek`
- Calculate `WeeklyProgressPercent` from WorkoutsThisWeek / WeeklyWorkoutGoal
- Calculate `CurrentStreakDays` from consecutive days with sessions
- Sum `MinutesTrainedThisWeek` and `TotalVolumeThisWeek` from this week's sessions
- Inject `IMediator` (currently only has `INavigationService`)

#### 1c. Build ExerciseLibraryPage and ExerciseDetailPage
- `ExerciseLibraryPage` — searchable list of exercises from `GetExercisesQuery`, with filters by category/muscle group
- `ExerciseDetailPage` — display exercise details (description, muscles, equipment, instructions, research notes)
- Create ViewModels: `ExerciseLibraryViewModel`, `ExerciseDetailViewModel`
- Register in DI and routes (routes already exist in AppShell)

### Priority 2: Phase 4 — AI Coach (per `docs/TASKS.md`)

Follow the Phase 4 checklist in `docs/TASKS.md` exactly. Key deliverables:
1. Integrate Anthropic .NET SDK in `RepWizard.Api`
2. `POST /api/v1/ai/chat` — SSE streaming endpoint
3. `AiContextBuilder` service in `RepWizard.Application`
4. `SaveAiMessageCommand` + handler for conversation persistence
5. `GetConversationQuery` + handler
6. Implement `CoachPage` with streaming chat UI (CoachViewModel already has stub structure)
7. `POST /api/v1/ai/generate-program` — two-phase: stream then parse + persist
8. `ProgramValidator` with science-based constraints (see IMPLEMENTATION.md Section 6.5)
9. `ProgramsPage` / `ProgramsViewModel` with program list
10. `ProgramDetailPage` / `ProgramDetailViewModel` (week-by-week view)
11. Tests: `AiContextBuilderTests`, `ProgramValidatorTests`

### Priority 3: Phase 5 — Polish (per `docs/TASKS.md`)

Follow Phase 5 checklist in `docs/TASKS.md`.

### After each priority block:
1. Run `dotnet test` — all tests must pass
2. Run `dotnet build RepWizard.App/RepWizard.App.csproj -f net9.0-android` — verify Android build
3. Update `docs/TASKS.md` — check off completed items
4. Create logical git commits with conventional prefixes
5. Push to remote
