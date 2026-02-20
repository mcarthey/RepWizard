using Microsoft.AspNetCore.Mvc;
using RepWizard.Core.Enums;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Shared.DTOs;

namespace RepWizard.Api.Endpoints;

public static class ExerciseEndpoints
{
    public static IEndpointRouteBuilder MapExerciseEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/exercises")
            .WithTags("Exercises");

        group.MapGet("/", async (
            [FromQuery] string? search,
            [FromQuery] ExerciseCategory? category,
            [FromQuery] Equipment? equipment,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            IExerciseRepository repo = default!,
            CancellationToken ct = default) =>
        {
            IReadOnlyList<Core.Entities.Exercise> exercises;

            if (!string.IsNullOrWhiteSpace(search))
                exercises = await repo.SearchAsync(search, ct);
            else if (category.HasValue)
                exercises = await repo.GetByCategoryAsync(category.Value, ct);
            else if (equipment.HasValue)
                exercises = await repo.GetByEquipmentAsync(equipment.Value, ct);
            else
                exercises = await repo.GetAllAsync(ct);

            var totalCount = exercises.Count;
            var paged = exercises
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(MapToDto)
                .ToList();

            return Results.Ok(new ApiResponse<IList<ExerciseDto>>
            {
                Success = true,
                Data = paged,
                Pagination = new PaginationInfo(page, pageSize, totalCount)
            });
        })
        .WithName("GetExercises")
        .WithSummary("Get paginated exercise library");

        group.MapGet("/{id:guid}", async (
            Guid id,
            IExerciseRepository repo,
            CancellationToken ct) =>
        {
            var exercise = await repo.GetByIdAsync(id, ct);
            if (exercise == null)
                return Results.NotFound(ApiResponse<object>.Fail("Exercise not found."));

            return Results.Ok(ApiResponse<ExerciseDto>.Ok(MapToDto(exercise)));
        })
        .WithName("GetExerciseById")
        .WithSummary("Get a single exercise by ID");

        return app;
    }

    private static ExerciseDto MapToDto(Core.Entities.Exercise e) => new()
    {
        Id = e.Id,
        Name = e.Name,
        Description = e.Description,
        Category = e.Category.ToString(),
        PrimaryMuscles = e.PrimaryMuscles.Select(m => m.ToString()).ToList(),
        SecondaryMuscles = e.SecondaryMuscles.Select(m => m.ToString()).ToList(),
        Equipment = e.Equipment.ToString(),
        Difficulty = e.Difficulty.ToString(),
        IsCompound = e.IsCompound,
        VideoUrl = e.VideoUrl,
        Instructions = e.Instructions.ToList(),
        ResearchNotes = e.ResearchNotes
    };
}
