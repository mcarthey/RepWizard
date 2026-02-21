using MediatR;
using RepWizard.Core.Common;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Core.Interfaces.Services;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Commands.Auth.RefreshToken;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, Result<AuthResponse>>
{
    private readonly IUserRepository _users;
    private readonly IAuthService _auth;

    public RefreshTokenCommandHandler(IUserRepository users, IAuthService auth)
    {
        _users = users;
        _auth = auth;
    }

    public async Task<Result<AuthResponse>> Handle(RefreshTokenCommand request, CancellationToken ct)
    {
        var claims = _auth.ValidateAccessToken(request.AccessToken);
        if (claims == null)
            return Result<AuthResponse>.Failure("Invalid access token.");

        var user = await _users.GetByIdAsync(claims.UserId, ct);
        if (user == null)
            return Result<AuthResponse>.Failure("User not found.");

        if (user.RefreshToken != request.RefreshToken)
            return Result<AuthResponse>.Failure("Invalid refresh token.");

        if (user.RefreshTokenExpiresAt < DateTime.UtcNow)
            return Result<AuthResponse>.Failure("Refresh token has expired. Please log in again.");

        var tokens = _auth.GenerateTokens(user.Id, user.Email, user.Name);
        user.RefreshToken = tokens.RefreshToken;
        user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(30);
        _users.Update(user);
        await _users.SaveChangesAsync(ct);

        return Result<AuthResponse>.Success(new AuthResponse
        {
            UserId = user.Id,
            Email = user.Email,
            Name = user.Name,
            AccessToken = tokens.AccessToken,
            RefreshToken = tokens.RefreshToken,
            ExpiresAt = tokens.ExpiresAt
        });
    }
}
