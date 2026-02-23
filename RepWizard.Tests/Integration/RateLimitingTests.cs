using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using RepWizard.Shared.DTOs;

namespace RepWizard.Tests.Integration;

public class RateLimitingTests : IntegrationTestBase
{
    [Fact]
    public async Task AuthEndpoint_ExceedsLimit_Returns429()
    {
        // Auth policy: 5 requests per minute
        var request = new RegisterRequest
        {
            Name = "Rate Limit Test",
            Email = "rl@example.com",
            Password = "securepassword123",
            FitnessGoal = "StrengthGain",
            ExperienceLevel = "Beginner"
        };

        HttpResponseMessage? lastResponse = null;
        for (var i = 0; i < 7; i++)
        {
            // Use unique emails so registration doesn't fail on duplicate
            request.Email = $"rl-{i}-{Guid.NewGuid():N}@example.com";
            lastResponse = await Client.PostAsJsonAsync("/api/v1/auth/register", request);
        }

        lastResponse!.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
    }

    [Fact]
    public async Task HealthEndpoint_NoRateLimit_AlwaysSucceeds()
    {
        // Health has no rate limiting — should always respond
        for (var i = 0; i < 10; i++)
        {
            var response = await Client.GetAsync("/health");
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }
    }

    [Fact]
    public async Task FixedPolicyEndpoint_WithinLimit_Succeeds()
    {
        var (auth, _) = await RegisterTestUser();

        // Exercises use "fixed" policy (60/min) — 5 requests should be well within limit
        for (var i = 0; i < 5; i++)
        {
            var response = await Client.GetAsync("/api/v1/exercises");
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }
    }
}
