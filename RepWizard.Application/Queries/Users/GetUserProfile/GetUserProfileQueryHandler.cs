using MediatR;
using RepWizard.Core.Common;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Users.GetUserProfile;

public class GetUserProfileQueryHandler : IRequestHandler<GetUserProfileQuery, Result<UserDto>>
{
    private readonly IUserRepository _users;

    public GetUserProfileQueryHandler(IUserRepository users)
    {
        _users = users;
    }

    public async Task<Result<UserDto>> Handle(GetUserProfileQuery request, CancellationToken ct)
    {
        var user = await _users.GetByIdAsync(request.UserId, ct);
        if (user == null)
            return Result<UserDto>.Failure("User not found.");

        return Result<UserDto>.Success(new UserDto
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            DateOfBirth = user.DateOfBirth,
            HeightCm = user.HeightCm,
            WeightKg = user.WeightKg,
            FitnessGoal = user.FitnessGoal.ToString(),
            ExperienceLevel = user.ExperienceLevel.ToString(),
            MedicalNotes = user.MedicalNotes
        });
    }
}
