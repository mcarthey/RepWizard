using System.Net;
using System.Text.Json;

namespace RepWizard.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly bool _includeDetails;

    public GlobalExceptionMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _includeDetails = environment.IsDevelopment();
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var supportId = Guid.NewGuid().ToString("N")[..12];
            var correlationId = context.Items.TryGetValue("CorrelationId", out var cid)
                ? cid?.ToString() ?? supportId
                : supportId;

            _logger.LogError(ex,
                "Unhandled exception. SupportId={SupportId} CorrelationId={CorrelationId} Path={Path} Method={Method}",
                supportId, correlationId, context.Request.Path, context.Request.Method);

            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";

            var response = _includeDetails
                ? new
                {
                    success = false,
                    error = ex.Message,
                    exceptionType = (string?)ex.GetType().Name,
                    supportId
                }
                : new
                {
                    success = false,
                    error = "An unexpected error occurred.",
                    exceptionType = (string?)null,
                    supportId
                };

            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    }
}
