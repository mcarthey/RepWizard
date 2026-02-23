using MediatR;
using Microsoft.AspNetCore.Mvc;
using RepWizard.Application.Queries.Exercises.GetExerciseById;
using RepWizard.Application.Queries.Exercises.GetExercises;
using RepWizard.Core.Enums;
using RepWizard.Shared.DTOs;

namespace RepWizard.Api.Endpoints;

public static class ExerciseEndpoints
{
    public static IEndpointRouteBuilder MapExerciseEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/exercises")
            .WithTags("Exercises")
            .RequireRateLimiting("fixed");

        group.MapGet("/", async (
            [FromQuery] string? search,
            [FromQuery] ExerciseCategory? category,
            [FromQuery] Equipment? equipment,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            IMediator mediator = default!,
            CancellationToken ct = default) =>
        {
            var result = await mediator.Send(
                new GetExercisesQuery(search, category, equipment, page, pageSize), ct);

            if (result.IsFailure)
                return Results.BadRequest(ApiResponse<object>.Fail(result.Error!));

            var paged = result.Value!;
            return Results.Ok(new ApiResponse<IList<ExerciseDto>>
            {
                Success = true,
                Data = paged.Items.ToList(),
                Pagination = new PaginationInfo(paged.Page, paged.PageSize, paged.TotalCount)
            });
        })
        .WithName("GetExercises")
        .WithSummary("Get paginated exercise library");

        group.MapGet("/{id:guid}", async (
            Guid id,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var result = await mediator.Send(new GetExerciseByIdQuery(id), ct);

            return result.IsSuccess
                ? Results.Ok(ApiResponse<ExerciseDto>.Ok(result.Value!))
                : Results.NotFound(ApiResponse<object>.Fail(result.Error!));
        })
        .WithName("GetExerciseById")
        .WithSummary("Get a single exercise by ID");

        return app;
    }
}
