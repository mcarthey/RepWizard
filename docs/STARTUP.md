Here's exactly what you need to run locally:

---

## Prerequisites

- .NET 9 SDK (global.json pins to 9.0.x)
- SQL Server LocalDB (ships with Visual Studio, or install separately)
- For Android: Android emulator with the `android` workload installed

Verify setup:
```bash
dotnet --version          # Should show 9.0.x
sqllocaldb info           # Should list MSSQLLocalDB
adb devices               # Should show emulator if running
```

---

## Terminal 1 — Start the API

```bash
cd RepWizard.Api
dotnet run --launch-profile https
# API is now at https://localhost:7001
# Scalar docs at https://localhost:7001/scalar
# Health check at https://localhost:7001/health
```

The API uses SQL Server LocalDB (`(localdb)\MSSQLLocalDB`) and auto-creates the `RepWizard_Dev` database on first run.

---

## Terminal 2 — Run the MAUI app

### Option A: Windows desktop (easiest)
```bash
cd RepWizard.App
dotnet run -f net9.0-windows10.0.19041.0
```

### Option B: Android emulator
```bash
# 1. Start the emulator (if not already running)
emulator -avd Pixel_7_API_36 &

# 2. Build and deploy to emulator
dotnet build RepWizard.App/RepWizard.App.csproj -f net9.0-android -t:Run -p:AndroidAttachDebugger=false

# Verify the app is running
adb shell ps -A | grep repwizard
```

**Note:** Do NOT use `adb install` with the debug APK — .NET MAUI uses Fast Deployment which requires `dotnet build -t:Run` for proper assembly deployment.

### Option C: IDE
Launch both API and App from Visual Studio with multiple startup projects.

---

## Do you need the API running?

| Feature | API required? |
|---|---|
| Logging sets, starting/completing sessions | No — writes directly to local SQLite |
| Viewing workout history, measurements | No — reads from local SQLite |
| Syncing data to the server | Yes — `SyncService` (Phase 5, stub for now) |
| AI Coach | Yes — calls `/api/v1/ai/...` |
| Seeding the exercise library | Yes — API seeds on startup |

The exercise library seed data comes from the API's startup, so on a fresh install you'd want the API running at least once so the exercises are available. After that, workout logging is fully offline.
