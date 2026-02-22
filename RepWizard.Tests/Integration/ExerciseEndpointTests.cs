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

public class ExerciseEndpointTests : IntegrationTestBase
{
    [Fact]
    public async Task GetExercises_ReturnsOkWithPaginatedList()
    {
        await SeedExercises();

        var response = await Client.GetAsync("/api/v1/exercises");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<IList<ExerciseDto>>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data.Should().NotBeEmpty();
        body.Pagination.Should().NotBeNull();
    }

    [Fact]
    public async Task GetExercises_WithSearch_FiltersResults()
    {
        await SeedExercises();

        var response = await Client.GetAsync("/api/v1/exercises?search=bench");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<IList<ExerciseDto>>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data.Should().NotBeEmpty();
        body.Data!.Should().AllSatisfy(e =>
            e.Name.Should().ContainEquivalentOf("bench"));
    }

    [Fact]
    public async Task GetExercises_WithCategoryFilter_FiltersResults()
    {
        await SeedExercises();

        var response = await Client.GetAsync("/api/v1/exercises?category=Strength");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<IList<ExerciseDto>>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data.Should().NotBeEmpty();
        body.Data!.Should().AllSatisfy(e =>
            e.Category.Should().Be("Strength"));
    }

    [Fact]
    public async Task GetExerciseById_ExistingId_ReturnsExercise()
    {
        await SeedExercises();

        // Get first exercise ID from the list
        var listResponse = await Client.GetAsync("/api/v1/exercises");
        var listBody = await listResponse.Content.ReadFromJsonAsync<ApiResponse<IList<ExerciseDto>>>();
        var firstExercise = listBody!.Data!.First();

        var response = await Client.GetAsync($"/api/v1/exercises/{firstExercise.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<ExerciseDto>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data!.Name.Should().Be(firstExercise.Name);
    }

    [Fact]
    public async Task GetExerciseById_NonExistentId_ReturnsNotFound()
    {
        var response = await Client.GetAsync($"/api/v1/exercises/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private async Task SeedExercises()
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        if (await db.Exercises.AnyAsync())
            return;

        db.Exercises.AddRange(
            new Exercise
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
            },
            new Exercise
            {
                Name = "Squat",
                Description = "Barbell back squat",
                Category = ExerciseCategory.Strength,
                PrimaryMuscles = new List<MuscleGroup> { MuscleGroup.Quads },
                SecondaryMuscles = new List<MuscleGroup> { MuscleGroup.Glutes },
                Equipment = Equipment.Barbell,
                Difficulty = Difficulty.Intermediate,
                IsCompound = true,
                Instructions = new List<string> { "Bar on back", "Squat down" }
            },
            new Exercise
            {
                Name = "Running",
                Description = "Treadmill or outdoor running",
                Category = ExerciseCategory.Cardio,
                PrimaryMuscles = new List<MuscleGroup> { MuscleGroup.Quads },
                SecondaryMuscles = new List<MuscleGroup> { MuscleGroup.Calves },
                Equipment = Equipment.None,
                Difficulty = Difficulty.Beginner,
                IsCompound = false,
                Instructions = new List<string> { "Run at steady pace" }
            }
        );
        await db.SaveChangesAsync();
    }

    private async Task<Guid> GetFirstExerciseId()
    {
        await SeedExercises();
        var response = await Client.GetAsync("/api/v1/exercises");
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<IList<ExerciseDto>>>();
        return body!.Data!.First().Id;
    }
}
