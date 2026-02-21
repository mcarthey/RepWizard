using MediatR;
using RepWizard.Application.Commands.Workouts.StartWorkoutSession;
using RepWizard.Core.Common;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Workouts.GetActiveSession;

public class GetActiveSessionQueryHandler
    : IRequestHandler<GetActiveSessionQuery, Result<WorkoutSessionDto?>>
{
    private readonly IWorkoutSessionRepository _sessions;

    public GetActiveSessionQueryHandler(IWorkoutSessionRepository sessions)
    {
        _sessions = sessions;
    }

    public async Task<Result<WorkoutSessionDto?>> Handle(
        GetActiveSessionQuery request,
        CancellationToken cancellationToken)
    {
        var session = await _sessions.GetActiveSessionForUserAsync(
            request.UserId, cancellationToken);

        if (session == null)
            return Result<WorkoutSessionDto?>.Success(null);

        return Result<WorkoutSessionDto?>.Success(
            StartWorkoutSessionCommandHandler.MapToDto(session));
    }
}
