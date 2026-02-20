using MediatR;
using RepWizard.Application.Commands.Workouts.StartWorkoutSession;
using RepWizard.Core.Common;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Workouts.GetWorkoutSession;

public class GetWorkoutSessionQueryHandler
    : IRequestHandler<GetWorkoutSessionQuery, Result<WorkoutSessionDto>>
{
    private readonly IWorkoutSessionRepository _sessions;

    public GetWorkoutSessionQueryHandler(IWorkoutSessionRepository sessions)
    {
        _sessions = sessions;
    }

    public async Task<Result<WorkoutSessionDto>> Handle(
        GetWorkoutSessionQuery request,
        CancellationToken cancellationToken)
    {
        var session = await _sessions.GetWithExercisesAndSetsAsync(request.SessionId, cancellationToken);
        if (session == null)
            return Result<WorkoutSessionDto>.Failure("Session not found.");

        return Result<WorkoutSessionDto>.Success(StartWorkoutSessionCommandHandler.MapToDto(session));
    }
}
