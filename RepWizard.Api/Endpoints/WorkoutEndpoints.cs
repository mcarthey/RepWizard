using MediatR;
using RepWizard.Application.Commands.Workouts.CompleteWorkoutSession;
using RepWizard.Application.Commands.Workouts.LogSet;
using RepWizard.Application.Commands.Workouts.StartWorkoutSession;
using RepWizard.Application.Queries.Exercises.GetExercisePR;
using RepWizard.Application.Queries.Workouts.GetSessionHistory;
using RepWizard.Application.Queries.Workouts.GetWorkoutSession;
using RepWizard.Shared.DTOs;

namespace RepWizard.Api.Endpoints;

public static class WorkoutEndpoints
{
    public static IEndpointRouteBuilder MapWorkoutEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/workouts")
            .WithTags("Workouts")
            .RequireAuthorization()
            .RequireRateLimiting("fixed");

        // POST /api/v1/workouts/sessions — start a new session
        group.MapPost("/sessions", async (
            StartSessionRequest request,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var result = await mediator.Send(
                new StartWorkoutSessionCommand(request.UserId, request.TemplateId, request.Notes), ct);

            return result.IsSuccess
                ? Results.Created($"/api/v1/workouts/sessions/{result.Value!.Id}",
                    ApiResponse<WorkoutSessionDto>.Ok(result.Value!))
                : Results.BadRequest(ApiResponse<object>.Fail(result.Errors));
        })
        .WithName("StartWorkoutSession")
        .WithSummary("Start a new workout session");

        // GET /api/v1/workouts/sessions/{id} — get session detail
        group.MapGet("/sessions/{id:guid}", async (
            Guid id,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var result = await mediator.Send(new GetWorkoutSessionQuery(id), ct);

            return result.IsSuccess
                ? Results.Ok(ApiResponse<WorkoutSessionDto>.Ok(result.Value!))
                : Results.NotFound(ApiResponse<object>.Fail(result.Error!));
        })
        .WithName("GetWorkoutSession")
        .WithSummary("Get a workout session with all exercises and sets");

        // PUT /api/v1/workouts/sessions/{id}/log-set — log a set
        group.MapPut("/sessions/{id:guid}/log-set", async (
            Guid id,
            LogSetRequest request,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var result = await mediator.Send(new LogSetCommand(
                id,
                request.ExerciseId,
                request.SetNumber,
                request.WeightKg,
                request.Reps,
                request.RepsInReserve,
                request.RPE,
                request.SetType,
                request.DurationSeconds), ct);

            return result.IsSuccess
                ? Results.Ok(ApiResponse<ExerciseSetDto>.Ok(result.Value!))
                : Results.BadRequest(ApiResponse<object>.Fail(result.Errors));
        })
        .WithName("LogSet")
        .WithSummary("Log a set to an active workout session");

        // POST /api/v1/workouts/sessions/{id}/complete — complete a session
        group.MapPost("/sessions/{id:guid}/complete", async (
            Guid id,
            CompleteSessionRequest? request,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var result = await mediator.Send(
                new CompleteWorkoutSessionCommand(id, request?.Notes), ct);

            return result.IsSuccess
                ? Results.Ok(ApiResponse<WorkoutSummaryDto>.Ok(result.Value!))
                : Results.BadRequest(ApiResponse<object>.Fail(result.Errors));
        })
        .WithName("CompleteWorkoutSession")
        .WithSummary("Complete an active workout session and trigger sync");

        // GET /api/v1/workouts/sessions?userId={id}&page=1&pageSize=20 — history list
        group.MapGet("/sessions", async (
            Guid userId,
            int page = 1,
            int pageSize = 20,
            IMediator mediator = default!,
            CancellationToken ct = default) =>
        {
            var result = await mediator.Send(
                new GetSessionHistoryQuery(userId, page, pageSize), ct);

            if (result.IsFailure)
                return Results.BadRequest(ApiResponse<object>.Fail(result.Error!));

            var paged = result.Value!;
            return Results.Ok(new ApiResponse<IList<WorkoutHistoryDto>>
            {
                Success = true,
                Data = paged.Items.ToList(),
                Pagination = new PaginationInfo(paged.Page, paged.PageSize, paged.TotalCount)
            });
        })
        .WithName("GetSessionHistory")
        .WithSummary("Get paginated workout session history for a user");

        // GET /api/v1/workouts/prs?userId={id}&exerciseId={id} — personal records
        group.MapGet("/prs", async (
            Guid userId,
            Guid? exerciseId,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var result = await mediator.Send(new GetExercisePRQuery(userId, exerciseId), ct);

            return result.IsSuccess
                ? Results.Ok(ApiResponse<IReadOnlyList<ExercisePRDto>>.Ok(result.Value!))
                : Results.BadRequest(ApiResponse<object>.Fail(result.Error!));
        })
        .WithName("GetExercisePRs")
        .WithSummary("Get personal records (best sets) per exercise for a user");

        return app;
    }
}

public record CompleteSessionRequest(string? Notes = null);
