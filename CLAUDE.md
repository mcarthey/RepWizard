# RepWizard — Claude Code Instructions

## Project Overview

RepWizard is a .NET 9 MAUI workout tracking mobile app using Clean Architecture (8 projects). Offline-first with SQLite on mobile, SQL Server LocalDB for the API server.

## Quick Reference

- **Solution**: `RepWizard.sln` (8 projects)
- **API**: `RepWizard.Api` — ASP.NET Core Minimal APIs on https://localhost:7001
- **MAUI App**: `RepWizard.App` — Shell-based navigation, 3 tabs (Today, Progress, Coach)
- **SDK pinned**: `global.json` pins to .NET 9.0.x — do not remove
- **Tests**: `dotnet test` from repo root (227 passing)
- **Solution filters**: `RepWizard.Dev.slnf` (dev, default build), `RepWizard.CI.slnf` (headless CI), `RepWizard.sln` (full)

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

## Current Status (All Phases Complete)

All 5 implementation phases + hardening + code quality pass + test gap closure are complete. 227 tests passing, 0 warnings.

### What's implemented:
- All 13 domain entities with business logic
- Full CQRS layer (commands, queries, validators, pipeline behaviors)
- 19 API endpoints (health, exercises, workouts, measurements, auth, sync, AI chat)
- JWT auth with PBKDF2 password hashing, refresh tokens
- Sync push/pull with conflict detection (server-wins + ConflictLog)
- AI Coach with SSE streaming chat, program generation, science-validated constraints
- All MAUI pages functional: Today, ActiveSession, Progress, Coach, Programs, ExerciseLibrary, Settings
- Offline-first workout logging (SQLite), Polly resilience on HttpClient
- GlobalExceptionMiddleware (env-aware), CorrelationIdMiddleware
- SyncConstants, SseParser shared helpers, ILogger on all catch blocks

### Deferred items (see `docs/TASKS.md`):
- Adaptive layouts for tablet/desktop (needs design specs)
- Notification service (rest timer alerts, workout reminders)
- App store packaging (APK/AAB, IPA)
- Wire AI-generated program into Today tab
- EF Core migrations (currently `EnsureCreated`)
- Rate limiting, contract testing, input validation at DB level
- SkiaSharp hero progress arc, motion system animations
- CHANGELOG.md

## Key Documentation

- `docs/IMPLEMENTATION.md` — Master specification — the authoritative source for all features
- `docs/TASKS.md` — Phase tracker with checkboxes — update this as tasks are completed
- `docs/ARCHITECTURE.md` — Architecture reference
- `docs/STARTUP.md` — How to run locally
- Cross-project docs (global at `~/.claude/`): HARDENING.md, CODE_SMELLS.md, TESTING-STRATEGY.md, ARCHITECTURE_PATTERNS.md

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
- Full `RepWizard.sln` fails on Windows (MAUI multi-targeting) — use `RepWizard.Dev.slnf` for local builds
- Infrastructure uses `System.IdentityModel.Tokens.Jwt` (not `Microsoft.AspNetCore.Authentication.JwtBearer`) to avoid Android runtime pack issue
- BUG-2 fix: `MarkAsNew()` on `BaseEntity` resets `Id` for EF Core sentinel check with client-generated Guids

## Key Patterns

- **EF Core write handlers**: If query uses `AsNoTracking`, must re-attach via `Update()` or call `MarkAsNew()` on new child entities before adding
- **Sync serialization**: Use `ReferenceHandler.IgnoreCycles` when serializing entities with navigation properties
- **SSE parsing**: Use `SseParser.TryParseDataLine()` from `RepWizard.Shared.Helpers` — no inline parsing
- **Sync constants**: Use `SyncEntityTypes` and `SyncActions` from `RepWizard.Shared.Constants` — no magic strings
- **BaseViewModel**: Uses `IsLoading` (not `IsBusy`); `App.xaml.cs` uses `CreateWindow` pattern
