using MediatR;
using RepWizard.Core.Common;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Workouts.GetActiveSession;

public record GetActiveSessionQuery(Guid UserId) : IRequest<Result<WorkoutSessionDto?>>;
