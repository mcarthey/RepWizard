using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RepWizard.Infrastructure.Data;
using RepWizard.Shared.DTOs;

namespace RepWizard.Tests.Integration;

public abstract class IntegrationTestBase : IDisposable
{
    protected readonly HttpClient Client;
    protected readonly WebApplicationFactory<Program> Factory;
    private readonly SqliteConnection _connection;

    protected IntegrationTestBase()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();

        // Pre-create schema on the shared connection
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;
        using (var ctx = new AppDbContext(options))
        {
            ctx.Database.EnsureCreated();
        }

        Factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Remove ALL DbContext-related registrations (SQL Server, etc.)
                    var descriptors = services.Where(d =>
                        d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                        d.ServiceType == typeof(DbContextOptions) ||
                        d.ServiceType == typeof(AppDbContext) ||
                        d.ServiceType.FullName?.Contains("EntityFrameworkCore") == true
                    ).ToList();
                    foreach (var d in descriptors) services.Remove(d);

                    // Re-register with the open SQLite in-memory connection
                    services.AddDbContext<AppDbContext>(opts =>
                        opts.UseSqlite(_connection));
                });
            });

        Client = Factory.CreateClient();
    }

    protected async Task<(AuthResponse Auth, string Password)> RegisterTestUser()
    {
        var password = "securepassword123";
        var request = new RegisterRequest
        {
            Name = "Test User",
            Email = $"test-{Guid.NewGuid():N}@example.com",
            Password = password,
            FitnessGoal = "StrengthGain",
            ExperienceLevel = "Beginner"
        };
        var response = await Client.PostAsJsonAsync("/api/v1/auth/register", request);
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>();
        return (body!.Data!, password);
    }

    public void Dispose()
    {
        Client.Dispose();
        Factory.Dispose();
        _connection.Dispose();
    }
}
