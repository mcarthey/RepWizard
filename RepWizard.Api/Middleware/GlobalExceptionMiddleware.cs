using System.Net;
using System.Text.Json;

namespace RepWizard.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
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

            var response = new
            {
                success = false,
                error = "An unexpected error occurred.",
                supportId
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    }
}
