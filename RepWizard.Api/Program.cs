using Microsoft.EntityFrameworkCore;
using RepWizard.Api.Endpoints;
using RepWizard.Application;
using RepWizard.Infrastructure;
using RepWizard.Infrastructure.Data;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// OpenAPI
builder.Services.AddOpenApi();

// Infrastructure — PostgreSQL for API server
builder.Services.AddInfrastructurePostgres(builder.Configuration);

// Application layer — validators + pipeline behaviors
builder.Services.AddApplication();

// MediatR — scan Application assembly for handlers
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(RepWizard.Application.DependencyInjection).Assembly));

// HttpClient factory — never instantiate raw HttpClient
builder.Services.AddHttpClient();

// CORS for development
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

// Apply migrations on startup in development
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // Note: in production, run migrations separately via dotnet ef database update
    // db.Database.Migrate();
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

app.UseHttpsRedirection();
app.UseCors();

// Map endpoint groups
app.MapHealthEndpoints();
app.MapExerciseEndpoints();
app.MapWorkoutEndpoints();
app.MapMeasurementEndpoints();

app.Run();

// Make Program accessible for WebApplicationFactory in tests
public partial class Program { }
