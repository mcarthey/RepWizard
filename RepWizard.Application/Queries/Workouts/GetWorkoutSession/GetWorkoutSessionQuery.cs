using MediatR;
using RepWizard.Core.Common;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Workouts.GetWorkoutSession;

public record GetWorkoutSessionQuery(Guid SessionId) : IRequest<Result<WorkoutSessionDto>>;
