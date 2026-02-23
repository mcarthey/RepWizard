using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RepWizard.Api.Endpoints;
using RepWizard.Application;
using RepWizard.Application.Services;
using RepWizard.Infrastructure;
using RepWizard.Infrastructure.Data;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// OpenAPI
builder.Services.AddOpenApi();

// Infrastructure — SQL Server LocalDB for API server
builder.Services.AddInfrastructureSqlServer(builder.Configuration);

// Application layer — validators + pipeline behaviors
builder.Services.AddApplication();

// MediatR — scan Application assembly for handlers
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(RepWizard.Application.DependencyInjection).Assembly));

// HttpClient factory — never instantiate raw HttpClient
builder.Services.AddHttpClient();

// AI Coach services
builder.Services.AddScoped<AiContextBuilder>();
builder.Services.AddAiChatService();

// Auth services (JWT)
builder.Services.AddAuthService();

// JWT Authentication — secret MUST be configured via appsettings.Development.json or environment variable
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException(
        "Jwt:Secret is not configured. Set it in appsettings.Development.json or via environment variable Jwt__Secret.");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "RepWizard.Api",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "RepWizard.App",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });
builder.Services.AddAuthorization();

// Rate limiting — built into ASP.NET Core 9, no NuGet needed
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // General API endpoints: 60 requests per minute
    options.AddFixedWindowLimiter("fixed", cfg =>
    {
        cfg.PermitLimit = 60;
        cfg.Window = TimeSpan.FromMinutes(1);
        cfg.QueueLimit = 0;
    });

    // AI endpoints: 10 requests per minute (expensive LLM calls)
    options.AddFixedWindowLimiter("ai", cfg =>
    {
        cfg.PermitLimit = 10;
        cfg.Window = TimeSpan.FromMinutes(1);
        cfg.QueueLimit = 0;
    });

    // Auth endpoints: 5 requests per minute (brute-force protection)
    options.AddFixedWindowLimiter("auth", cfg =>
    {
        cfg.PermitLimit = 5;
        cfg.Window = TimeSpan.FromMinutes(1);
        cfg.QueueLimit = 0;
    });
});

// CORS for development
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

// Apply pending migrations on startup in development
// Note: if migrating from EnsureCreated, drop the existing LocalDB first:
//   dotnet ef database drop --project RepWizard.Infrastructure --startup-project RepWizard.Api
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (db.Database.IsSqlServer())
        db.Database.Migrate();
    else
        db.Database.EnsureCreated();
}

// OpenAPI / Scalar docs
app.MapOpenApi();
if (app.Environment.IsDevelopment())
{
    app.MapScalarApiReference(options =>
    {
        options.Title = "RepWizard API";
        options.Theme = ScalarTheme.DeepSpace;
    });
}

// Middleware pipeline (order matters)
app.UseMiddleware<RepWizard.Api.Middleware.CorrelationIdMiddleware>();
app.UseMiddleware<RepWizard.Api.Middleware.GlobalExceptionMiddleware>();

app.UseHttpsRedirection();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// Map endpoint groups
app.MapHealthEndpoints();
app.MapAuthEndpoints();
app.MapUserEndpoints();
app.MapExerciseEndpoints();
app.MapWorkoutEndpoints();
app.MapMeasurementEndpoints();
app.MapAiEndpoints();
app.MapSyncEndpoints();

app.Run();

// Make Program accessible for WebApplicationFactory in tests
public partial class Program { }
