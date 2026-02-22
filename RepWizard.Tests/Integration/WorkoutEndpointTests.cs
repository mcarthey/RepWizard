using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RepWizard.Core.Entities;
using RepWizard.Core.Enums;
using RepWizard.Infrastructure.Data;
using RepWizard.Shared.DTOs;

namespace RepWizard.Tests.Integration;

public class WorkoutEndpointTests : IntegrationTestBase
{
    [Fact]
    public async Task StartSession_ValidRequest_ReturnsCreated()
    {
        var (auth, _) = await RegisterTestUser();

        var request = new StartSessionRequest
        {
            UserId = auth.UserId,
            Notes = "Test session"
        };

        var response = await Client.PostAsJsonAsync("/api/v1/workouts/sessions", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<WorkoutSessionDto>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data!.Id.Should().NotBeEmpty();
        body.Data.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task StartSession_EmptyUserId_ReturnsBadRequest()
    {
        await RegisterTestUser(); // authenticate so we get past auth middleware

        var request = new StartSessionRequest
        {
            UserId = Guid.Empty
        };

        var response = await Client.PostAsJsonAsync("/api/v1/workouts/sessions", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetSession_ExistingId_ReturnsSessionDetail()
    {
        var sessionId = await StartTestSession();

        var response = await Client.GetAsync($"/api/v1/workouts/sessions/{sessionId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<WorkoutSessionDto>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data!.Id.Should().Be(sessionId);
    }

    [Fact]
    public async Task GetSession_NonExistentId_ReturnsNotFound()
    {
        await RegisterTestUser(); // authenticate so we get past auth middleware

        var response = await Client.GetAsync($"/api/v1/workouts/sessions/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task LogSet_ValidRequest_ReturnsOk()
    {
        var sessionId = await StartTestSession();
        var exerciseId = await SeedAndGetExerciseId();

        var request = new LogSetRequest
        {
            ExerciseId = exerciseId,
            SetNumber = 1,
            Reps = 10,
            WeightKg = 60
        };

        var response = await Client.PutAsJsonAsync(
            $"/api/v1/workouts/sessions/{sessionId}/log-set", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<ExerciseSetDto>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data!.Reps.Should().Be(10);
        body.Data.WeightKg.Should().Be(60);
    }

    [Fact]
    public async Task LogSet_InvalidReps_ReturnsBadRequest()
    {
        var sessionId = await StartTestSession();
        var exerciseId = await SeedAndGetExerciseId();

        var request = new LogSetRequest
        {
            ExerciseId = exerciseId,
            SetNumber = 1,
            Reps = 0,
            WeightKg = 60
        };

        var response = await Client.PutAsJsonAsync(
            $"/api/v1/workouts/sessions/{sessionId}/log-set", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CompleteSession_ActiveSession_ReturnsOk()
    {
        var sessionId = await StartTestSession();
        var exerciseId = await SeedAndGetExerciseId();

        // Log at least one set
        var logRequest = new LogSetRequest
        {
            ExerciseId = exerciseId,
            SetNumber = 1,
            Reps = 10,
            WeightKg = 60
        };
        await Client.PutAsJsonAsync($"/api/v1/workouts/sessions/{sessionId}/log-set", logRequest);

        var response = await Client.PostAsJsonAsync(
            $"/api/v1/workouts/sessions/{sessionId}/complete",
            new { Notes = "Good session" });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<WorkoutSummaryDto>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data!.CompletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task GetSessionHistory_ReturnsCompletedSessions()
    {
        var sessionId = await StartTestSession();
        var exerciseId = await SeedAndGetExerciseId();

        // Log a set so the session can be completed
        var logRequest = new LogSetRequest
        {
            ExerciseId = exerciseId,
            SetNumber = 1,
            Reps = 10,
            WeightKg = 60
        };
        await Client.PutAsJsonAsync($"/api/v1/workouts/sessions/{sessionId}/log-set", logRequest);

        // Complete the session
        await Client.PostAsJsonAsync(
            $"/api/v1/workouts/sessions/{sessionId}/complete",
            new { Notes = "Done" });

        // Verify it appears in session history
        // Get the userId from the session detail
        var sessionResponse = await Client.GetAsync($"/api/v1/workouts/sessions/{sessionId}");
        var sessionBody = await sessionResponse.Content.ReadFromJsonAsync<ApiResponse<WorkoutSessionDto>>();
        var userId = sessionBody!.Data!.UserId;

        var response = await Client.GetAsync(
            $"/api/v1/workouts/sessions?userId={userId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<IList<WorkoutHistoryDto>>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Pagination.Should().NotBeNull();
        body.Data.Should().NotBeEmpty();
    }

    private async Task<Guid> StartTestSession()
    {
        var (auth, _) = await RegisterTestUser();
        var request = new StartSessionRequest { UserId = auth.UserId };
        var response = await Client.PostAsJsonAsync("/api/v1/workouts/sessions", request);
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<WorkoutSessionDto>>();
        return body!.Data!.Id;
    }

    private async Task<Guid> SeedAndGetExerciseId()
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var existing = await db.Exercises.FirstOrDefaultAsync();
        if (existing != null)
            return existing.Id;

        var exercise = new Exercise
        {
            Name = "Bench Press",
            Description = "Barbell bench press",
            Category = ExerciseCategory.Strength,
            PrimaryMuscles = new List<MuscleGroup> { MuscleGroup.Chest },
            SecondaryMuscles = new List<MuscleGroup> { MuscleGroup.Triceps },
            Equipment = Equipment.Barbell,
            Difficulty = Difficulty.Intermediate,
            IsCompound = true,
            Instructions = new List<string> { "Lie on bench", "Press bar up" }
        };
        db.Exercises.Add(exercise);
        await db.SaveChangesAsync();
        return exercise.Id;
    }
}
