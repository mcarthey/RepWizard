using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
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

// CORS for development
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

// Ensure database is created on startup in development
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
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
