using System.Net;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RepWizard.Infrastructure.Data;

namespace RepWizard.Tests.Integration;

public class MiddlewareTests : IntegrationTestBase
{
    [Fact]
    public async Task Request_WithoutCorrelationId_GeneratesAndReturnsOne()
    {
        var response = await Client.GetAsync("/health");

        response.Headers.Should().ContainKey("X-Correlation-Id");
        var correlationId = response.Headers.GetValues("X-Correlation-Id").First();
        correlationId.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Request_WithCorrelationId_EchoesItBack()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/health");
        request.Headers.Add("X-Correlation-Id", "test-correlation-123");

        var response = await Client.SendAsync(request);

        response.Headers.Should().ContainKey("X-Correlation-Id");
        var correlationId = response.Headers.GetValues("X-Correlation-Id").First();
        correlationId.Should().Be("test-correlation-123");
    }

    [Fact]
    public async Task MultipleRequests_GetDifferentCorrelationIds()
    {
        var response1 = await Client.GetAsync("/health");
        var response2 = await Client.GetAsync("/health");

        var id1 = response1.Headers.GetValues("X-Correlation-Id").First();
        var id2 = response2.Headers.GetValues("X-Correlation-Id").First();

        id1.Should().NotBe(id2);
    }
}

/// <summary>
/// Separate test class with its own WebApplicationFactory that injects a /test/throw
/// endpoint via IStartupFilter to test the global exception middleware behavior.
/// </summary>
public class GlobalExceptionMiddlewareTests : IDisposable
{
    private readonly HttpClient _client;
    private readonly SqliteConnection _connection;
    private readonly WebApplicationFactory<Program> _factory;

    public GlobalExceptionMiddlewareTests()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();

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
                    var descriptors = services.Where(d =>
                        d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                        d.ServiceType == typeof(DbContextOptions) ||
                        d.ServiceType == typeof(AppDbContext) ||
                        d.ServiceType.FullName?.Contains("EntityFrameworkCore") == true
                    ).ToList();
                    foreach (var d in descriptors) services.Remove(d);

                    services.AddDbContext<AppDbContext>(opts =>
                        opts.UseSqlite(_connection));

                    services.AddSingleton<IStartupFilter, ThrowEndpointStartupFilter>();
                });
            });

        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task UnhandledException_Returns500WithSupportId()
    {
        var response = await _client.GetAsync("/test/throw");

        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        var content = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(content).RootElement;
        json.GetProperty("success").GetBoolean().Should().BeFalse();
        // In Development (test default), middleware exposes actual exception details
        json.GetProperty("error").GetString().Should().Be("Test exception");
        json.GetProperty("exceptionType").GetString().Should().Be("InvalidOperationException");
        json.GetProperty("supportId").GetString().Should().HaveLength(12);
    }

    [Fact]
    public async Task UnhandledException_IncludesCorrelationIdInResponse()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/test/throw");
        request.Headers.Add("X-Correlation-Id", "test-error-correlation");

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        response.Headers.Should().ContainKey("X-Correlation-Id");
        var correlationId = response.Headers.GetValues("X-Correlation-Id").First();
        correlationId.Should().Be("test-error-correlation");
    }

    public void Dispose()
    {
        _client.Dispose();
        _factory.Dispose();
        _connection.Dispose();
    }

    private class ThrowEndpointStartupFilter : IStartupFilter
    {
        public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next)
        {
            return app =>
            {
                // Run the main pipeline first (which registers middleware)
                next(app);

                // Add a terminal middleware that handles /test/throw
                app.Map("/test/throw", branch =>
                {
                    branch.Run(_ => throw new InvalidOperationException("Test exception"));
                });
            };
        }
    }
}
