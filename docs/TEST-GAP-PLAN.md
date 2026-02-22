# RepWizard — Test Gap Implementation Plan

> **Context:** RepWizard has 190 passing tests across 31 test files. A gap analysis against `docs/TESTING-STRATEGY.md` identified 4 priority areas where HTTP-level integration tests and infrastructure tests are missing. This plan closes those gaps.
>
> **Current test ratio:** ~85% unit / ~13% integration / ~2% E2E
> **Target ratio (per strategy):** ~60% unit / ~30% integration / ~10% E2E
>
> **Estimated new tests:** ~45–55 tests across 6 new test files

---

## CRITICAL RULES — Non-Negotiable

**These rules exist because previous AI attempts violated them, causing cascading failures. Read `docs/TESTING-STRATEGY.md` Section 2 (Anti-Patterns) before proceeding.**

### Rule 1: NEVER modify production code to make tests pass

If a test fails, the test is wrong — not the production code. The 190 existing tests all pass. The production code is correct. Do not:
- Remove `AsNoTracking()` from repository queries (it's there for performance, per the hardening pass)
- Add `_repository.Update()` calls to command handlers that don't need them
- Change endpoint authorization, middleware registration, or DI configuration
- Weaken validation rules, remove guards, or alter business logic

If your test requires a tracked entity but the repository returns an untracked one, that means your test is using the wrong approach — you should be going through the API endpoints (POST/PUT), not trying to mutate entities returned by read-only queries.

### Rule 2: Integration tests go THROUGH the HTTP pipeline

Integration tests call API endpoints via `HttpClient`. They do NOT:
- Directly instantiate `AppDbContext` and insert rows
- Call repository methods to set up test data
- Resolve services from the DI container to manipulate state

**Correct pattern:** To create a workout session for testing, POST to `/api/v1/workouts/sessions`. To log a set, PUT to `/api/v1/workouts/sessions/{id}/log-set`. To complete it, POST to `/api/v1/workouts/sessions/{id}/complete`. Each step goes through the real endpoint, real validation, real handler.

### Rule 3: If a fix creates a new problem, STOP

Do not chain fixes. If removing `AsNoTracking()` fixes one thing but breaks another, you are treating symptoms. Step back, re-read the existing code, and understand why it's structured the way it is before proposing changes.

### Rule 4: The test infrastructure is your friend

`IntegrationTestBase` provides a `WebApplicationFactory` with SQLite in-memory. Use it. If it doesn't support your scenario (e.g., you need an authenticated client), **extend IntegrationTestBase** with a helper method — don't bypass it.

---

## Prerequisites — Read Before Writing Any Code

1. **Run `dotnet test` from the repo root.** All 190 tests must pass before you touch anything.
2. **Read these existing files to understand conventions:**
   - `RepWizard.Tests/Integration/IntegrationTestBase.cs` — the shared base class (SQLite in-memory + `WebApplicationFactory`)
   - `RepWizard.Tests/Integration/AuthEndpointTests.cs` — the one existing integration test class (4 tests)
   - Any 2 handler test files (e.g., `LogSetCommandHandlerTests.cs`, `RegisterCommandHandlerTests.cs`) — for naming conventions
3. **Use FluentAssertions** (`.Should().Be(...)`) for all assertions — that is the project convention.
4. **Use the `ApiResponse<T>` envelope** when deserializing responses. All endpoints return `ApiResponse<T>`.
5. **Do NOT introduce new test frameworks.** Use xUnit, FluentAssertions, Moq — nothing else.
6. **Do NOT modify existing tests or production code.** Only add new test files (and extend IntegrationTestBase with helpers if needed).

---

## Execution Instructions

Execute the 4 phases below **in order**. After each phase:
1. Run `dotnet test` — all tests (old + new) must pass with 0 failures
2. Run `dotnet build RepWizard.sln` — 0 errors, 0 warnings
3. Verify you have NOT modified any production code files (only test files should be changed)
4. Create a git commit with prefix `test:` (e.g., `test: add auth integration tests for missing scenarios`)

**Do NOT proceed to the next phase if tests are failing.** Fix the test, not the production code.

---

## Phase 1: Auth Integration Tests (Highest Priority)

**File:** `RepWizard.Tests/Integration/AuthEndpointTests.cs` — **extend the existing file**

The existing class has 4 tests. Add these 6 missing scenarios from `docs/TESTING-STRATEGY.md` Section 12:

### 1.1 Register with duplicate email → 400/409

```
Test name: Register_DuplicateEmail_ReturnsBadRequest
Steps:
  1. Register a user with email "dup@example.com"
  2. Register again with the SAME email
  3. Assert second response is BadRequest (400)
  4. Assert response body contains error message about duplicate
```

### 1.2 Login with valid credentials → 200 with tokens

```
Test name: Login_ValidCredentials_ReturnsOkWithTokens
Steps:
  1. Register a user (capture email + password)
  2. POST /api/v1/auth/login with those credentials
  3. Assert 200 OK
  4. Deserialize ApiResponse<AuthResponse>
  5. Assert AccessToken is not null/empty
  6. Assert RefreshToken is not null/empty
  7. Assert Email matches
```

### 1.3 Access protected endpoint without token → 401

**Status:** ✅ Implemented — `.RequireAuthorization()` added to protected endpoint groups (Users, Workouts, Measurements, AI, Sync).

```
Test name: ProtectedEndpoint_NoToken_ReturnsUnauthorized
Steps:
  1. Create a plain HttpClient (no Bearer token)
  2. GET /api/v1/users/{some-guid}
  3. Assert 401 Unauthorized
```

### 1.4 Token refresh with valid refresh token → new tokens

```
Test name: Refresh_ValidToken_ReturnsNewTokens
Steps:
  1. Register a user → capture AccessToken + RefreshToken
  2. POST /api/v1/auth/refresh with { accessToken, refreshToken }
  3. Assert 200 OK
  4. Deserialize ApiResponse<AuthResponse>
  5. Assert new AccessToken is not null/empty
  6. Assert new RefreshToken is not null/empty
```

### 1.5 Token refresh with invalid refresh token → 401

```
Test name: Refresh_InvalidToken_ReturnsUnauthorized
Steps:
  1. POST /api/v1/auth/refresh with { accessToken: "fake", refreshToken: "fake" }
  2. Assert 401 Unauthorized
```

### 1.6 Register with weak/missing password → 400

```
Test name: Register_MissingPassword_ReturnsBadRequest
Steps:
  1. POST /api/v1/auth/register with empty password
  2. Assert 400 BadRequest
```

### Helper method to add

Add a private helper to the existing class (or to IntegrationTestBase if it's useful across classes):

```csharp
private async Task<(AuthResponse Auth, string Password)> RegisterAndGetAuth()
{
    var password = "securepassword123";
    var request = new RegisterRequest
    {
        Name = "Test User",
        Email = $"test-{Guid.NewGuid():N}@example.com",
        Password = password,
        FitnessGoal = "StrengthGain",
        ExperienceLevel = "Beginner"
    };
    var response = await Client.PostAsJsonAsync("/api/v1/auth/register", request);
    response.EnsureSuccessStatusCode();
    var body = await response.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>();
    return (body!.Data!, password);
}
```

**If adding this helper to IntegrationTestBase** (recommended — Phase 2 needs it too), also add:

```csharp
protected async Task<HttpClient> CreateAuthenticatedClient()
{
    // Register a user and return an HttpClient with the Bearer token set
    var password = "securepassword123";
    var request = new RegisterRequest { ... };
    var response = await Client.PostAsJsonAsync("/api/v1/auth/register", request);
    response.EnsureSuccessStatusCode();
    var body = await response.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>();
    Client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", body!.Data!.AccessToken);
    return Client;
}
```

**Note:** Since `IntegrationTestBase` creates one `HttpClient` per instance, and each test class gets its own instance, setting the Authorization header on `Client` works within a single test. But if multiple tests in the same class need different auth states, create a new client from the factory. Consider whether you need this — look at how the existing base class works before deciding.

---

## Phase 2: Core Endpoint Integration Tests

**New files (3):**
- `RepWizard.Tests/Integration/ExerciseEndpointTests.cs`
- `RepWizard.Tests/Integration/WorkoutEndpointTests.cs`
- `RepWizard.Tests/Integration/MeasurementEndpointTests.cs`

All inherit from `IntegrationTestBase`.

### 2.1 ExerciseEndpointTests (~5 tests)

Exercises are seeded from `exercises.json` during `EnsureCreated()`. The seed data should be available in the SQLite in-memory DB. **Verify this first** — if seed data isn't present, you'll need to understand how the seeding works and whether it runs with `EnsureCreated()`.

```
Test: GetExercises_ReturnsOkWithPaginatedList
  GET /api/v1/exercises
  Assert 200, Data is non-empty list, Pagination is present

Test: GetExercises_WithSearch_FiltersResults
  GET /api/v1/exercises?search=bench
  Assert 200, all returned exercises contain "bench" (case-insensitive)

Test: GetExercises_WithCategoryFilter_FiltersResults
  GET /api/v1/exercises?category=Chest (or the enum int value — check what the endpoint expects)
  Assert 200, all returned exercises have matching category

Test: GetExerciseById_ExistingId_ReturnsExercise
  GET /api/v1/exercises (get first ID from list)
  GET /api/v1/exercises/{id}
  Assert 200, exercise name matches

Test: GetExerciseById_NonExistentId_ReturnsNotFound
  GET /api/v1/exercises/{random-guid}
  Assert 404
```

### 2.2 WorkoutEndpointTests (~8 tests)

**Important:** Workout endpoints have `.RequireAuthorization()`. Every request needs a Bearer token. Use the `CreateAuthenticatedClient()` helper from IntegrationTestBase (added in Phase 1) to get an authenticated HttpClient + UserId.

**Test data setup pattern:** All test data must be created through the API endpoints — NOT by inserting rows into the database. To test "get session", first POST to create the session. To test "complete session", first POST to start it and PUT to log a set. Each test builds its own data through the real HTTP pipeline.

```
Test: StartSession_ValidRequest_ReturnsCreated
  Get authenticated client + UserId
  POST /api/v1/workouts/sessions { userId, notes: "Test session" }
  Assert 201 Created
  Assert response body has session Id, IsActive == true

Test: StartSession_NoAuth_ReturnsUnauthorized
  Use a plain (unauthenticated) Client
  POST /api/v1/workouts/sessions { userId: any-guid }
  Assert 401

Test: GetSession_ExistingId_ReturnsSessionDetail
  Start a session via POST → get sessionId
  GET /api/v1/workouts/sessions/{sessionId}
  Assert 200, session data matches

Test: GetSession_NonExistentId_ReturnsNotFound
  GET /api/v1/workouts/sessions/{random-guid}
  Assert 404

Test: LogSet_ValidRequest_ReturnsOk
  Start a session via POST → get sessionId
  Get first exercise ID from GET /api/v1/exercises (exercises endpoint is public)
  PUT /api/v1/workouts/sessions/{sessionId}/log-set { exerciseId, setNumber: 1, reps: 10, weightKg: 60 }
  Assert 200
  Assert response contains ExerciseSetDto with matching reps/weight

Test: LogSet_InvalidReps_ReturnsBadRequest
  Start a session via POST → get sessionId
  PUT /api/v1/workouts/sessions/{sessionId}/log-set { exerciseId, reps: 0, ... }
  Assert 400 (validator requires Reps > 0)

Test: CompleteSession_ActiveSession_ReturnsOk
  Start a session via POST, log at least one set via PUT, then:
  POST /api/v1/workouts/sessions/{sessionId}/complete
  Assert 200
  Assert response contains WorkoutSummaryDto with CompletedAt set

Test: GetSessionHistory_ReturnsCompletedSessions
  Complete a session (full flow: POST start → PUT log-set → POST complete)
  GET /api/v1/workouts/sessions?userId={userId}
  Assert 200, list contains the completed session
  Assert Pagination is present
```

### 2.3 MeasurementEndpointTests (~5 tests)

**Important:** Measurement endpoints also have `.RequireAuthorization()`. Use authenticated client.

```
Test: LogMeasurement_ValidRequest_ReturnsCreated
  Get authenticated client + UserId
  POST /api/v1/measurements { userId, weightKg: 80.5 }
  Assert 201 Created
  Assert response body has measurement Id, WeightKg matches

Test: LogMeasurement_NoMetrics_ReturnsBadRequest
  POST /api/v1/measurements { userId: validId } (all metric fields null)
  Assert 400 (validator requires at least one metric)

Test: GetMeasurementHistory_ReturnsList
  Log a measurement via POST
  GET /api/v1/measurements?userId={userId}
  Assert 200, list contains the measurement

Test: GetMeasurementHistory_WithLimit_RespectsLimit
  Log 3 measurements
  GET /api/v1/measurements?userId={userId}&limit=2
  Assert 200, list has exactly 2 items

Test: GetProgressChart_ReturnsChartData
  Log a measurement
  GET /api/v1/measurements/progress-chart?userId={userId}&weeksBack=4
  Assert 200, body has WeeklyVolume, StrengthTrends, BodyComposition arrays
```

---

## Phase 3: Middleware Integration Tests

**New file:** `RepWizard.Tests/Integration/MiddlewareTests.cs`

Inherits from `IntegrationTestBase`. Tests the middleware behavior through real HTTP requests.

### 3.1 CorrelationIdMiddleware (~3 tests)

```
Test: Request_WithoutCorrelationId_GeneratesAndReturnsOne
  GET /health (no special headers)
  Assert response has X-Correlation-Id header
  Assert X-Correlation-Id value is a non-empty string

Test: Request_WithCorrelationId_EchoesItBack
  GET /health with request header X-Correlation-Id = "test-correlation-123"
  Assert response header X-Correlation-Id == "test-correlation-123"

Test: MultipleRequests_GetDifferentCorrelationIds
  GET /health (no header) → capture correlation ID 1
  GET /health (no header) → capture correlation ID 2
  Assert id1 != id2
```

### 3.2 GlobalExceptionMiddleware (~2 tests)

Testing exception handling requires triggering an unhandled exception. Options:

**Option A (preferred):** If there's a way to trigger an exception through a normal endpoint (e.g., passing data that causes a null reference in a handler), use that.

**Option B:** Create a test-only endpoint via `WebApplicationFactory.WithWebHostBuilder`. Override `ConfigureServices` or `Configure` to add a `/test/throw` endpoint that throws an exception. This is a common pattern:

```csharp
_factory = _factory.WithWebHostBuilder(builder =>
{
    builder.Configure(app =>
    {
        app.Map("/test/throw", () => { throw new InvalidOperationException("Test exception"); });
    });
});
```

However, this may conflict with the existing `IntegrationTestBase` setup. If it does, create a separate test class that sets up its own factory.

```
Test: UnhandledException_Returns500WithSupportId
  Trigger an unhandled exception
  Assert 500 Internal Server Error
  Assert response body is JSON with { success: false, error: "An unexpected error occurred.", supportId: "..." }
  Assert supportId is a 12-character string

Test: UnhandledException_IncludesCorrelationIdInResponse
  Send request with X-Correlation-Id header
  Trigger an unhandled exception
  Assert response still has X-Correlation-Id header (correlation middleware runs before exception middleware)
```

**Important:** The `GlobalExceptionMiddleware` response shape is `{ success, error, supportId }` — this is NOT wrapped in `ApiResponse<T>`. Deserialize as a raw `JsonElement` or anonymous type.

---

## Phase 4: SyncService Unit Tests

**New file:** `RepWizard.Tests/Infrastructure/Services/SyncServiceTests.cs`

This tests the `SyncService` class directly with:
- **Real SQLite in-memory** `AppDbContext` (same pattern as `RepositoryIntegrationTests`)
- **Mocked `IHttpClientFactory`** with a `MockHttpMessageHandler` to simulate API responses
- **Mocked `ILogger<SyncService>`**

### MockHttpMessageHandler Pattern

```csharp
// Reusable within the test class
private class MockHttpMessageHandler : HttpMessageHandler
{
    private readonly Func<HttpRequestMessage, Task<HttpResponseMessage>> _handler;

    public MockHttpMessageHandler(Func<HttpRequestMessage, Task<HttpResponseMessage>> handler)
        => _handler = handler;

    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
        => _handler(request);
}
```

Use this to control what the "API" returns without hitting a real server.

### Test Setup Pattern

```csharp
// Each test creates:
// 1. SQLite in-memory connection + AppDbContext (same as RepositoryIntegrationTests)
// 2. MockHttpMessageHandler configured for the specific scenario
// 3. IHttpClientFactory mock that returns HttpClient wrapping the handler
// 4. SyncService instance with all dependencies
```

### 4.1 HasPendingChangesAsync (~2 tests)

```
Test: HasPendingChanges_NoPendingSessions_ReturnsFalse
  Create a user + session with SyncState = Synced
  Assert HasPendingChangesAsync returns false

Test: HasPendingChanges_NewSession_ReturnsTrue
  Create a user + session with SyncState = New
  Assert HasPendingChangesAsync returns true
```

### 4.2 SyncAsync — Happy Path (~2 tests)

```
Test: SyncAsync_PendingSessions_PushesAndReturnsCounts
  Create a user + 2 sessions with SyncState = New
  Mock HTTP: POST /api/v1/sync/push → 200 with { entitiesProcessed: 2, conflictsDetected: 0, conflicts: [] }
  Mock HTTP: GET /api/v1/sync/pull → 200 with { entities: [], serverTimestamp: now }
  Call SyncAsync
  Assert result.Success == true, EntitiesPushed == 2, EntitiesPulled == 0
  Assert both sessions now have SyncState == Synced in the DB

Test: SyncAsync_NoPendingSessions_SkipsPush
  Create a user + session with SyncState = Synced
  Mock HTTP: GET /api/v1/sync/pull → 200 with { entities: [], serverTimestamp: now }
  (No push mock needed — push should short-circuit)
  Call SyncAsync
  Assert result.Success == true, EntitiesPushed == 0
```

### 4.3 SyncAsync — Conflict Handling (~1 test)

```
Test: SyncAsync_ServerReturnsConflict_MarksSessionAsConflict
  Create a user + 1 session with SyncState = New
  Mock HTTP: POST /api/v1/sync/push → 200 with { entitiesProcessed: 1, conflictsDetected: 1, conflicts: [{ entityId: sessionId, ... }] }
  Mock HTTP: GET /api/v1/sync/pull → 200 with empty
  Call SyncAsync
  Assert session's SyncState == Conflict in DB
  Assert result.ConflictsDetected == 1
```

### 4.4 SyncAsync — Error Handling (~3 tests)

```
Test: SyncAsync_ApiUnreachable_FallsBackToLocalSync
  Create a user + 1 session with SyncState = New
  Mock HTTP: throw HttpRequestException on any request
  Call SyncAsync
  Assert result.Success == true (fallback succeeds)
  Assert result.ErrorMessage contains "Offline mode"
  Assert session's SyncState == Synced in DB (local-only sync)

Test: SyncAsync_Cancelled_ReturnsCancelledResult
  Create a user + session
  Create a CancellationTokenSource, cancel it immediately
  Call SyncAsync with the cancelled token
  Assert result.Success == false
  Assert result.ErrorMessage contains "cancelled"

Test: SyncAsync_UnexpectedException_ReturnsFailure
  Create a user + session with SyncState = New
  Mock HTTP: throw generic Exception("boom")
  Call SyncAsync
  Assert result.Success == false
  Assert result.ErrorMessage == "boom"
```

---

## Summary

| Phase | File | New Tests | Priority |
|-------|------|-----------|----------|
| 1 | `Integration/AuthEndpointTests.cs` (extend) | ~6 | Highest |
| 2a | `Integration/ExerciseEndpointTests.cs` (new) | ~5 | High |
| 2b | `Integration/WorkoutEndpointTests.cs` (new) | ~8 | High |
| 2c | `Integration/MeasurementEndpointTests.cs` (new) | ~5 | High |
| 3 | `Integration/MiddlewareTests.cs` (new) | ~5 | Medium |
| 4 | `Infrastructure/Services/SyncServiceTests.cs` (new) | ~8 | Medium |
| **Total** | **5 new files + 1 extended** | **~37–45** | |

**Expected final test count: ~227–235 tests**

---

## Conventions Checklist

Before committing, verify each new test file follows these conventions:

- [ ] Namespace matches folder: `RepWizard.Tests.Integration` or `RepWizard.Tests.Infrastructure.Services`
- [ ] Class inherits from `IntegrationTestBase` (for HTTP tests) or manages its own SQLite connection (for infrastructure tests)
- [ ] All assertions use FluentAssertions (`.Should()`)
- [ ] Test names follow `Method_Scenario_ExpectedResult` pattern
- [ ] Uses `[Fact]` for single-case tests, `[Theory]` + `[InlineData]` for parameterized
- [ ] API responses deserialized via `ApiResponse<T>` (except exception middleware which returns a raw shape)
- [ ] No `Thread.Sleep`, no hardcoded ports, no external dependencies
- [ ] Each test is independent — no test depends on another test's side effects
- [ ] `dotnet test` passes with 0 failures
- [ ] `dotnet build RepWizard.sln` has 0 errors, 0 warnings

---

## Key Reference Files

Read these before starting:

| File | Purpose |
|------|---------|
| `RepWizard.Tests/Integration/IntegrationTestBase.cs` | Base class for all integration tests |
| `RepWizard.Tests/Integration/AuthEndpointTests.cs` | Existing integration test example |
| `RepWizard.Tests/Infrastructure/RepositoryIntegrationTests.cs` | SQLite in-memory pattern for non-HTTP tests |
| `RepWizard.Tests/Infrastructure/Services/JwtAuthServiceTests.cs` | Service-level test pattern |
| `RepWizard.Shared/DTOs/UserDtos.cs` | Auth DTOs (RegisterRequest, LoginRequest, AuthResponse, RefreshTokenRequest) |
| `RepWizard.Shared/DTOs/WorkoutDtos.cs` | Workout DTOs |
| `RepWizard.Shared/DTOs/MeasurementDtos.cs` | Measurement DTOs |
| `RepWizard.Shared/DTOs/SyncDtos.cs` | Sync DTOs |
| `RepWizard.Shared/DTOs/ApiResponse.cs` | Response envelope — ALL endpoints use this |
| `RepWizard.Api/Endpoints/AuthEndpoints.cs` | Auth routes + RefreshTokenRequest record |
| `RepWizard.Api/Endpoints/WorkoutEndpoints.cs` | Workout routes + CompleteSessionRequest record |
| `RepWizard.Api/Endpoints/ExerciseEndpoints.cs` | Exercise routes |
| `RepWizard.Api/Endpoints/MeasurementEndpoints.cs` | Measurement routes |
| `RepWizard.Api/Middleware/GlobalExceptionMiddleware.cs` | Exception handler response shape |
| `RepWizard.Api/Middleware/CorrelationIdMiddleware.cs` | Correlation ID header handling |
| `RepWizard.Infrastructure/Services/SyncService.cs` | Full sync implementation to unit test |
| `docs/TESTING-STRATEGY.md` | The strategy doc these tests satisfy |
