using MediatR;
using RepWizard.Core.Common;
using RepWizard.Core.Interfaces;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Commands.Workouts.CompleteWorkoutSession;

public class CompleteWorkoutSessionCommandHandler
    : IRequestHandler<CompleteWorkoutSessionCommand, Result<WorkoutSummaryDto>>
{
    private readonly IWorkoutSessionRepository _sessions;
    private readonly ISyncService _sync;

    public CompleteWorkoutSessionCommandHandler(
        IWorkoutSessionRepository sessions,
        ISyncService sync)
    {
        _sessions = sessions;
        _sync = sync;
    }

    public async Task<Result<WorkoutSummaryDto>> Handle(
        CompleteWorkoutSessionCommand request,
        CancellationToken cancellationToken)
    {
        var session = await _sessions.GetWithExercisesAndSetsAsync(request.SessionId, cancellationToken);
        if (session == null)
            return Result<WorkoutSummaryDto>.Failure("Session not found.");

        if (!session.IsActive)
            return Result<WorkoutSummaryDto>.Failure("Session is already completed.");

        if (!string.IsNullOrWhiteSpace(request.Notes))
            session.Notes = request.Notes;

        session.Complete();
        await _sessions.SaveChangesAsync(cancellationToken);

        // Trigger sync in the background — do not await so the UI is not blocked.
        _ = _sync.SyncAsync(session.UserId, CancellationToken.None);

        var totalSets = session.SessionExercises.SelectMany(se => se.Sets).Count();
        var summary = new WorkoutSummaryDto
        {
            Id = session.Id,
            StartedAt = session.StartedAt,
            CompletedAt = session.CompletedAt,
            TemplateName = session.Template?.Name,
            TotalSets = totalSets,
            TotalVolume = session.GetTotalVolume(),
            DurationMinutes = (int)session.GetDuration().TotalMinutes
        };

        return Result<WorkoutSummaryDto>.Success(summary);
    }
}
