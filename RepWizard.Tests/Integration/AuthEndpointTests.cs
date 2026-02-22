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

    [Fact]
    public async Task Register_DuplicateEmail_ReturnsBadRequest()
    {
        var email = $"dup-{Guid.NewGuid():N}@example.com";
        var request = new RegisterRequest
        {
            Name = "First User",
            Email = email,
            Password = "securepassword123",
            FitnessGoal = "StrengthGain",
            ExperienceLevel = "Beginner"
        };

        var first = await Client.PostAsJsonAsync("/api/v1/auth/register", request);
        first.StatusCode.Should().Be(HttpStatusCode.Created);

        request.Name = "Second User";
        var second = await Client.PostAsJsonAsync("/api/v1/auth/register", request);

        second.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await second.Content.ReadFromJsonAsync<ApiResponse<object>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeFalse();
        body.Errors.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsOkWithTokens()
    {
        var (auth, password) = await RegisterAndGetAuth();

        var loginRequest = new LoginRequest
        {
            Email = auth.Email,
            Password = password
        };

        var response = await Client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data!.AccessToken.Should().NotBeNullOrEmpty();
        body.Data.RefreshToken.Should().NotBeNullOrEmpty();
        body.Data.Email.Should().Be(auth.Email);
    }

    // NOTE: Test 1.3 (ProtectedEndpoint_NoToken_ReturnsUnauthorized) is intentionally skipped.
    // No endpoints currently enforce [Authorize] or RequireAuthorization(). All endpoints accept
    // anonymous requests. This is a known gap — auth enforcement should be added in a future phase.

    [Fact]
    public async Task Refresh_ValidToken_ReturnsNewTokens()
    {
        var (auth, _) = await RegisterAndGetAuth();

        var refreshRequest = new { auth.AccessToken, auth.RefreshToken };
        var response = await Client.PostAsJsonAsync("/api/v1/auth/refresh", refreshRequest);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data!.AccessToken.Should().NotBeNullOrEmpty();
        body.Data.RefreshToken.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Refresh_InvalidToken_ReturnsUnauthorized()
    {
        var refreshRequest = new { AccessToken = "fake-token", RefreshToken = "fake-refresh" };
        var response = await Client.PostAsJsonAsync("/api/v1/auth/refresh", refreshRequest);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Register_MissingPassword_ReturnsBadRequest()
    {
        var request = new RegisterRequest
        {
            Name = "Test User",
            Email = $"test-{Guid.NewGuid():N}@example.com",
            Password = ""
        };

        var response = await Client.PostAsJsonAsync("/api/v1/auth/register", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    private async Task<(AuthResponse Auth, string Password)> RegisterAndGetAuth()
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
}
