using MediatR;
using RepWizard.Core.Common;
using RepWizard.Core.Enums;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Commands.Users.UpdateProfile;

public class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, Result<UserDto>>
{
    private readonly IUserRepository _users;

    public UpdateProfileCommandHandler(IUserRepository users)
    {
        _users = users;
    }

    public async Task<Result<UserDto>> Handle(UpdateProfileCommand request, CancellationToken ct)
    {
        var user = await _users.GetByIdAsync(request.UserId, ct);
        if (user == null)
            return Result<UserDto>.Failure("User not found.");

        if (request.Name != null) user.Name = request.Name;
        if (request.DateOfBirth.HasValue) user.DateOfBirth = request.DateOfBirth;
        if (request.HeightCm.HasValue) user.HeightCm = request.HeightCm;
        if (request.WeightKg.HasValue) user.WeightKg = request.WeightKg;
        if (request.MedicalNotes != null) user.MedicalNotes = request.MedicalNotes;

        if (request.FitnessGoal != null && Enum.TryParse<FitnessGoal>(request.FitnessGoal, true, out var goal))
            user.FitnessGoal = goal;
        if (request.ExperienceLevel != null && Enum.TryParse<ExperienceLevel>(request.ExperienceLevel, true, out var level))
            user.ExperienceLevel = level;

        _users.Update(user);
        await _users.SaveChangesAsync(ct);

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
