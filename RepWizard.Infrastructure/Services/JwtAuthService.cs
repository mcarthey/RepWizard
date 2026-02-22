using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using RepWizard.Core.Interfaces.Services;

namespace RepWizard.Infrastructure.Services;

/// <summary>
/// JWT-based authentication service. Handles password hashing (PBKDF2),
/// access token generation (JWT), and refresh token generation.
/// </summary>
public class JwtAuthService : IAuthService
{
    private readonly string _secret;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _accessTokenMinutes;
    private readonly int _refreshTokenDays;
    private readonly ILogger<JwtAuthService> _logger;

    public JwtAuthService(IConfiguration configuration, ILogger<JwtAuthService> logger)
    {
        var jwtSection = configuration.GetSection("Jwt");
        _secret = jwtSection["Secret"]
            ?? throw new InvalidOperationException(
                "Jwt:Secret is not configured. Set it in appsettings.Development.json or via environment variable Jwt__Secret.");
        _issuer = jwtSection["Issuer"] ?? "RepWizard.Api";
        _audience = jwtSection["Audience"] ?? "RepWizard.App";
        _accessTokenMinutes = int.TryParse(jwtSection["AccessTokenMinutes"], out var atm) ? atm : 60;
        _refreshTokenDays = int.TryParse(jwtSection["RefreshTokenDays"], out var rtd) ? rtd : 30;
        _logger = logger;
    }

    public string HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            salt,
            iterations: 100_000,
            HashAlgorithmName.SHA256,
            outputLength: 32);

        var combined = new byte[48]; // 16 salt + 32 hash
        Buffer.BlockCopy(salt, 0, combined, 0, 16);
        Buffer.BlockCopy(hash, 0, combined, 16, 32);
        return Convert.ToBase64String(combined);
    }

    public bool VerifyPassword(string password, string passwordHash)
    {
        var combined = Convert.FromBase64String(passwordHash);
        if (combined.Length != 48) return false;

        var salt = combined[..16];
        var storedHash = combined[16..];

        var computedHash = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            salt,
            iterations: 100_000,
            HashAlgorithmName.SHA256,
            outputLength: 32);

        return CryptographicOperations.FixedTimeEquals(storedHash, computedHash);
    }

    public AuthTokens GenerateTokens(Guid userId, string email, string name)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTime.UtcNow.AddMinutes(_accessTokenMinutes);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(JwtRegisteredClaimNames.Name, name),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);
        var refreshToken = GenerateRefreshToken();

        return new AuthTokens(accessToken, refreshToken, expiresAt);
    }

    public string GenerateRefreshToken()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    }

    public AuthTokenClaims? ValidateAccessToken(string token)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var handler = new JwtSecurityTokenHandler();

        try
        {
            var principal = handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = false, // Allow expired tokens for refresh flow
                ValidateIssuerSigningKey = true,
                ValidIssuer = _issuer,
                ValidAudience = _audience,
                IssuerSigningKey = key
            }, out _);

            var userId = Guid.Parse(
                principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "");
            var email = principal.FindFirst(JwtRegisteredClaimNames.Email)?.Value
                ?? principal.FindFirst(ClaimTypes.Email)?.Value ?? "";
            var name = principal.FindFirst(JwtRegisteredClaimNames.Name)?.Value
                ?? principal.FindFirst(ClaimTypes.Name)?.Value ?? "";

            return new AuthTokenClaims(userId, email, name);
        }
        catch (SecurityTokenExpiredException ex)
        {
            _logger.LogDebug(ex, "Token validation failed: token expired");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Token validation failed: {Message}", ex.Message);
            return null;
        }
    }
}
