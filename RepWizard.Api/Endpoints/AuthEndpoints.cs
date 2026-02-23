using MediatR;
using RepWizard.Application.Commands.Auth.Login;
using RepWizard.Application.Commands.Auth.RefreshToken;
using RepWizard.Application.Commands.Auth.Register;
using RepWizard.Shared.DTOs;

namespace RepWizard.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/auth")
            .WithTags("Auth")
            .RequireRateLimiting("auth");

        // POST /api/v1/auth/register
        group.MapPost("/register", async (
            RegisterRequest request,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var result = await mediator.Send(
                new RegisterCommand(request.Name, request.Email, request.Password,
                    request.FitnessGoal, request.ExperienceLevel), ct);

            return result.IsSuccess
                ? Results.Created($"/api/v1/users/{result.Value!.UserId}",
                    ApiResponse<AuthResponse>.Ok(result.Value!))
                : Results.BadRequest(ApiResponse<object>.Fail(result.Errors));
        })
        .WithName("Register")
        .WithSummary("Register a new user account");

        // POST /api/v1/auth/login
        group.MapPost("/login", async (
            LoginRequest request,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var result = await mediator.Send(
                new LoginCommand(request.Email, request.Password), ct);

            return result.IsSuccess
                ? Results.Ok(ApiResponse<AuthResponse>.Ok(result.Value!))
                : Results.Unauthorized();
        })
        .WithName("Login")
        .WithSummary("Authenticate and receive JWT tokens");

        // POST /api/v1/auth/refresh
        group.MapPost("/refresh", async (
            RefreshTokenRequest request,
            IMediator mediator,
            CancellationToken ct) =>
        {
            var result = await mediator.Send(
                new RefreshTokenCommand(request.AccessToken, request.RefreshToken), ct);

            return result.IsSuccess
                ? Results.Ok(ApiResponse<AuthResponse>.Ok(result.Value!))
                : Results.Unauthorized();
        })
        .WithName("RefreshToken")
        .WithSummary("Refresh an expired access token");

        return app;
    }
}

public record RefreshTokenRequest(string AccessToken, string RefreshToken);
