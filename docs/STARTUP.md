Here's exactly what you need to run locally:

---

**Terminal 1 — start the API**
```bash
cd RepWizard.Api
dotnet run --launch-profile https
# API is now at https://localhost:7001
# Scalar docs at https://localhost:7001/scalar
```

**Terminal 2 — run the MAUI app** (Windows desktop is the easiest target without a phone/emulator)
```bash
cd RepWizard.App
dotnet run -f net9.0-windows10.0.19041.0
```

Or launch both from your IDE with multiple startup projects.

---

**Do you need the API running?** It depends on what you're doing:

| Feature | API required? |
|---|---|
| Logging sets, starting/completing sessions | No — writes directly to local SQLite |
| Viewing workout history, measurements | No — reads from local SQLite |
| Syncing data to the server | Yes — `SyncService` (Phase 5, stub for now) |
| AI Coach | Yes — calls `/api/v1/ai/...` |
| Seeding the exercise library | Yes — API seeds on startup |

The exercise library seed data comes from the API's startup, so on a fresh install you'd want the API running at least once so the exercises are available. After that, workout logging is fully offline.