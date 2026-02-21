namespace RepWizard.Core.Interfaces.Services;

/// <summary>
/// Authentication service for JWT token generation and password hashing.
/// </summary>
public interface IAuthService
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string passwordHash);
    AuthTokens GenerateTokens(Guid userId, string email, string name);
    string GenerateRefreshToken();
    AuthTokenClaims? ValidateAccessToken(string token);
}

public record AuthTokens(string AccessToken, string RefreshToken, DateTime ExpiresAt);

public record AuthTokenClaims(Guid UserId, string Email, string Name);
