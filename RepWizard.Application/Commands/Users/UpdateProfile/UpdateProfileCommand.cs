using MediatR;
using RepWizard.Core.Common;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Commands.Users.UpdateProfile;

public record UpdateProfileCommand(
    Guid UserId,
    string? Name,
    DateTime? DateOfBirth,
    decimal? HeightCm,
    decimal? WeightKg,
    string? FitnessGoal,
    string? ExperienceLevel,
    string? MedicalNotes) : IRequest<Result<UserDto>>;
