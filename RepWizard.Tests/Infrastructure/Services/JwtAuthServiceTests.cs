using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using RepWizard.Infrastructure.Services;

namespace RepWizard.Tests.Infrastructure.Services;

public class JwtAuthServiceTests
{
    private readonly JwtAuthService _authService;

    public JwtAuthServiceTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "RepWizard-Test-Secret-Key-Must-Be-At-Least-32-Bytes!!",
                ["Jwt:Issuer"] = "RepWizard.Api.Test",
                ["Jwt:Audience"] = "RepWizard.App.Test",
                ["Jwt:AccessTokenMinutes"] = "60",
                ["Jwt:RefreshTokenDays"] = "30"
            })
            .Build();

        _authService = new JwtAuthService(config, new Mock<ILogger<JwtAuthService>>().Object);
    }

    [Fact]
    public void HashPassword_ReturnsNonEmptyHash()
    {
        var hash = _authService.HashPassword("test-password");
        hash.Should().NotBeNullOrEmpty();
        hash.Should().NotBe("test-password");
    }

    [Fact]
    public void VerifyPassword_CorrectPassword_ReturnsTrue()
    {
        var hash = _authService.HashPassword("my-password");
        _authService.VerifyPassword("my-password", hash).Should().BeTrue();
    }

    [Fact]
    public void VerifyPassword_WrongPassword_ReturnsFalse()
    {
        var hash = _authService.HashPassword("my-password");
        _authService.VerifyPassword("wrong-password", hash).Should().BeFalse();
    }

    [Fact]
    public void GenerateTokens_ReturnsValidTokens()
    {
        var userId = Guid.NewGuid();
        var tokens = _authService.GenerateTokens(userId, "test@example.com", "Test User");

        tokens.AccessToken.Should().NotBeNullOrEmpty();
        tokens.RefreshToken.Should().NotBeNullOrEmpty();
        tokens.ExpiresAt.Should().BeAfter(DateTime.UtcNow);
    }

    [Fact]
    public void ValidateAccessToken_ValidToken_ReturnsClaims()
    {
        var userId = Guid.NewGuid();
        var tokens = _authService.GenerateTokens(userId, "test@example.com", "Test User");

        var claims = _authService.ValidateAccessToken(tokens.AccessToken);

        claims.Should().NotBeNull();
        claims!.UserId.Should().Be(userId);
        claims.Email.Should().Be("test@example.com");
        claims.Name.Should().Be("Test User");
    }

    [Fact]
    public void ValidateAccessToken_InvalidToken_ReturnsNull()
    {
        var claims = _authService.ValidateAccessToken("not-a-valid-token");
        claims.Should().BeNull();
    }

    [Fact]
    public void GenerateRefreshToken_ReturnsUniqueTokens()
    {
        var token1 = _authService.GenerateRefreshToken();
        var token2 = _authService.GenerateRefreshToken();

        token1.Should().NotBeNullOrEmpty();
        token2.Should().NotBeNullOrEmpty();
        token1.Should().NotBe(token2);
    }

    [Fact]
    public void HashPassword_SamePassword_DifferentHashes()
    {
        var hash1 = _authService.HashPassword("same-password");
        var hash2 = _authService.HashPassword("same-password");

        // Different salts should produce different hashes
        hash1.Should().NotBe(hash2);

        // But both should verify correctly
        _authService.VerifyPassword("same-password", hash1).Should().BeTrue();
        _authService.VerifyPassword("same-password", hash2).Should().BeTrue();
    }
}
