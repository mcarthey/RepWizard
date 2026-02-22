using MediatR;
using RepWizard.Application.Commands.Users.UpdateProfile;
using RepWizard.Application.Queries.Users.GetUserProfile;
using RepWizard.Shared.DTOs;

namespace RepWizard.Api.Endpoints;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/users")
            .WithTags("Users")
            .RequireAuthorization();

        // GET /api/v1/users/{id}
        group.MapGet("/{id:guid}", async (
            Guid id,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var result = await mediator.Send(new GetUserProfileQuery(id), ct);

            return result.IsSuccess
                ? Results.Ok(ApiResponse<UserDto>.Ok(result.Value!))
                : Results.NotFound(ApiResponse<object>.Fail(result.Error!));
        })
        .WithName("GetUserProfile")
        .WithSummary("Get user profile by ID");

        // PUT /api/v1/users/{id}
        group.MapPut("/{id:guid}", async (
            Guid id,
            UpdateProfileRequest request,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var result = await mediator.Send(new UpdateProfileCommand(
                id,
                request.Name,
                request.DateOfBirth,
                request.HeightCm,
                request.WeightKg,
                request.FitnessGoal,
                request.ExperienceLevel,
                request.MedicalNotes), ct);

            return result.IsSuccess
                ? Results.Ok(ApiResponse<UserDto>.Ok(result.Value!))
                : Results.BadRequest(ApiResponse<object>.Fail(result.Errors));
        })
        .WithName("UpdateUserProfile")
        .WithSummary("Update user profile");

        return app;
    }
}
