using MediatR;
using RepWizard.Core.Common;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Commands.Workouts.StartWorkoutSession;

public record StartWorkoutSessionCommand(
    Guid UserId,
    Guid? TemplateId,
    string? Notes
) : IRequest<Result<WorkoutSessionDto>>;
