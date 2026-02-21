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
- **ActiveSessionPage** — ViewModel is fully implemented, XAML is 20-line placeholder
- CoachPage, ProgramsPage, ProgramDetailPage, ExerciseLibraryPage, ExerciseDetailPage, SettingsPage

### What's not started:
- Phase 4: AI Coach (Anthropic SDK, SSE streaming, program generation)
- Phase 5: Auth, real sync, notifications, polish

## Key Documentation

- `docs/IMPLEMENTATION.md` — Master specification (667 lines)
- `docs/TASKS.md` — Phase tracker with checkboxes
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
