using MediatR;
using RepWizard.Application.Commands.Programs.ActivateProgram;
using RepWizard.Application.Commands.Programs.CreateTrainingProgram;
using RepWizard.Application.Queries.Programs.GetTrainingPrograms;
using RepWizard.Shared.DTOs;

namespace RepWizard.Api.Endpoints;

public static class ProgramEndpoints
{
    public static IEndpointRouteBuilder MapProgramEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/programs")
            .WithTags("Programs")
            .RequireAuthorization();

        // POST /api/v1/programs — create a training program
        group.MapPost("/", async (
            CreateProgramRequest request,
            IMediator mediator,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var userId = GetUserId(httpContext);
            if (userId == Guid.Empty)
                return Results.BadRequest(ApiResponse<object>.Fail("UserId is required."));

            var command = new CreateTrainingProgramCommand(
                UserId: userId,
                Name: request.Name,
                DurationWeeks: request.DurationWeeks,
                GoalDescription: request.GoalDescription,
                GeneratedByAi: request.GeneratedByAi,
                AiReasoning: request.AiReasoning,
                ActivateImmediately: request.ActivateImmediately,
                Days: request.Days);

            var result = await mediator.Send(command, ct);

            return result.IsSuccess
                ? Results.Created($"/api/v1/programs/{result.Value!.Id}",
                    ApiResponse<TrainingProgramDetailDto>.Ok(result.Value!))
                : Results.BadRequest(ApiResponse<object>.Fail(result.Error!));
        })
        .WithName("CreateProgram")
        .WithSummary("Create a new training program");

        // POST /api/v1/programs/{id}/activate — activate a program
        group.MapPost("/{id:guid}/activate", async (
            Guid id,
            IMediator mediator,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var userId = GetUserId(httpContext);

            var result = await mediator.Send(
                new ActivateProgramCommand(userId, id), ct);

            return result.IsSuccess
                ? Results.Ok(ApiResponse<bool>.Ok(true))
                : Results.BadRequest(ApiResponse<object>.Fail(result.Error!));
        })
        .WithName("ActivateProgram")
        .WithSummary("Activate a training program (deactivates any currently active program)");

        return app;
    }

    private static Guid GetUserId(HttpContext httpContext)
    {
        // Extract user ID from JWT claims (matches AuthEndpoints pattern)
        var userIdClaim = httpContext.User.FindFirst("userId")?.Value
                       ?? httpContext.User.FindFirst("sub")?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }
}
