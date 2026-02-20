using MediatR;
using RepWizard.Application.Commands.Workouts.CompleteWorkoutSession;
using RepWizard.Application.Commands.Workouts.LogSet;
using RepWizard.Application.Commands.Workouts.StartWorkoutSession;
using RepWizard.Application.Queries.Workouts.GetWorkoutSession;
using RepWizard.Shared.DTOs;

namespace RepWizard.Api.Endpoints;

public static class WorkoutEndpoints
{
    public static IEndpointRouteBuilder MapWorkoutEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/workouts")
            .WithTags("Workouts");

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

        return app;
    }
}

public record CompleteSessionRequest(string? Notes = null);
