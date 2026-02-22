using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using RepWizard.Shared.DTOs;

namespace RepWizard.Tests.Integration;

public class AuthEndpointTests : IntegrationTestBase
{
    [Fact]
    public async Task Register_ValidRequest_ReturnsCreatedWithTokens()
    {
        var request = new RegisterRequest
        {
            Name = "Integration Test User",
            Email = $"test-{Guid.NewGuid():N}@example.com",
            Password = "securepassword123",
            FitnessGoal = "StrengthGain",
            ExperienceLevel = "Beginner"
        };

        var response = await Client.PostAsJsonAsync("/api/v1/auth/register", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data!.AccessToken.Should().NotBeNullOrEmpty();
        body.Data.RefreshToken.Should().NotBeNullOrEmpty();
        body.Data.Name.Should().Be("Integration Test User");
    }

    [Fact]
    public async Task Register_InvalidEmail_ReturnsBadRequest()
    {
        var request = new RegisterRequest
        {
            Name = "Test",
            Email = "not-an-email",
            Password = "securepassword123"
        };

        var response = await Client.PostAsJsonAsync("/api/v1/auth/register", request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_InvalidCredentials_ReturnsUnauthorized()
    {
        var request = new LoginRequest
        {
            Email = "nonexistent@example.com",
            Password = "wrongpassword"
        };

        var response = await Client.PostAsJsonAsync("/api/v1/auth/login", request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task HealthCheck_ReturnsOk()
    {
        var response = await Client.GetAsync("/health");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
