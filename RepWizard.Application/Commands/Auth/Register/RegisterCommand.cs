using MediatR;
using RepWizard.Core.Common;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Commands.Auth.Register;

public record RegisterCommand(
    string Name,
    string Email,
    string Password,
    string? FitnessGoal,
    string? ExperienceLevel) : IRequest<Result<AuthResponse>>;
