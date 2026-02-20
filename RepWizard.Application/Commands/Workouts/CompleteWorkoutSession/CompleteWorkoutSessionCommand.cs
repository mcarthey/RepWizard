using MediatR;
using RepWizard.Core.Common;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Commands.Workouts.CompleteWorkoutSession;

public record CompleteWorkoutSessionCommand(
    Guid SessionId,
    string? Notes = null
) : IRequest<Result<WorkoutSummaryDto>>;
