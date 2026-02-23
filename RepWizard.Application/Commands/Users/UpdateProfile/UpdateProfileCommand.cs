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
    string? MedicalNotes,
    string? LongTermGoalText = null,
    int? LongTermGoalMonths = null,
    string? ShortTermFocusText = null,
    int? ShortTermFocusWeeks = null,
    int? AvailableDaysPerWeek = null,
    int? SessionLengthMinutes = null,
    string? AvailableEquipment = null,
    string? MovementLimitations = null) : IRequest<Result<UserDto>>;
