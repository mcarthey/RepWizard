using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RepWizard.Infrastructure.Data;

namespace RepWizard.Tests.Integration;

public abstract class IntegrationTestBase : IDisposable
{
    protected readonly HttpClient Client;
    private readonly SqliteConnection _connection;
    private readonly WebApplicationFactory<Program> _factory;

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

        _factory = new WebApplicationFactory<Program>()
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

        Client = _factory.CreateClient();
    }

    public void Dispose()
    {
        Client.Dispose();
        _factory.Dispose();
        _connection.Dispose();
    }
}
