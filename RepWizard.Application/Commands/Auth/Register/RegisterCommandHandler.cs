using MediatR;
using RepWizard.Core.Common;
using RepWizard.Core.Entities;
using RepWizard.Core.Enums;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Core.Interfaces.Services;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Commands.Auth.Register;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<AuthResponse>>
{
    private readonly IUserRepository _users;
    private readonly IAuthService _auth;

    public RegisterCommandHandler(IUserRepository users, IAuthService auth)
    {
        _users = users;
        _auth = auth;
    }

    public async Task<Result<AuthResponse>> Handle(RegisterCommand request, CancellationToken ct)
    {
        if (await _users.EmailExistsAsync(request.Email, ct))
            return Result<AuthResponse>.Failure("An account with this email already exists.");

        var user = new User
        {
            Name = request.Name,
            Email = request.Email.ToLowerInvariant(),
            PasswordHash = _auth.HashPassword(request.Password)
        };

        if (Enum.TryParse<FitnessGoal>(request.FitnessGoal, true, out var goal))
            user.FitnessGoal = goal;
        if (Enum.TryParse<ExperienceLevel>(request.ExperienceLevel, true, out var level))
            user.ExperienceLevel = level;

        var tokens = _auth.GenerateTokens(user.Id, user.Email, user.Name);
        user.RefreshToken = tokens.RefreshToken;
        user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(30);

        await _users.AddAsync(user, ct);
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
