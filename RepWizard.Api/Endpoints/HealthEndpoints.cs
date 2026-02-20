namespace RepWizard.Api.Endpoints;

public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/health", () => Results.Ok(new
        {
            status = "healthy",
            timestamp = DateTime.UtcNow,
            version = "1.0.0"
        }))
        .WithName("GetHealth")
        .WithTags("Health")
        .WithSummary("Health check endpoint")
        .WithDescription("Returns the current health status of the API.")
        .AllowAnonymous();

        return app;
    }
}
