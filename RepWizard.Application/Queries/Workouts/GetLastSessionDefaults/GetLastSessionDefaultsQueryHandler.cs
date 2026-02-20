using MediatR;
using RepWizard.Core.Common;
using RepWizard.Core.Enums;
using RepWizard.Core.Interfaces.Repositories;

namespace RepWizard.Application.Queries.Workouts.GetLastSessionDefaults;

public class GetLastSessionDefaultsQueryHandler
    : IRequestHandler<GetLastSessionDefaultsQuery, Result<IReadOnlyDictionary<Guid, LastSetDefault>>>
{
    private readonly IWorkoutSessionRepository _sessions;

    public GetLastSessionDefaultsQueryHandler(IWorkoutSessionRepository sessions)
    {
        _sessions = sessions;
    }

    public async Task<Result<IReadOnlyDictionary<Guid, LastSetDefault>>> Handle(
        GetLastSessionDefaultsQuery request,
        CancellationToken cancellationToken)
    {
        // Fetch the last 14 days of sessions to find the most recent set per exercise.
        var recentSessions = await _sessions.GetRecentSessionsAsync(request.UserId, 90, cancellationToken);

        // For each exercise, find the most recent working set.
        var defaults = recentSessions
            .OrderByDescending(s => s.StartedAt)
            .SelectMany(s => s.SessionExercises)
            .GroupBy(se => se.ExerciseId)
            .ToDictionary(
                g => g.Key,
                g =>
                {
                    var lastSet = g
                        .OrderByDescending(se => se.WorkoutSession?.StartedAt)
                        .SelectMany(se => se.Sets)
                        .Where(set => set.SetType == SetType.Working)
                        .OrderByDescending(set => set.SetNumber)
                        .FirstOrDefault();

                    return lastSet == null
                        ? new LastSetDefault(null, 0, null, null)
                        : new LastSetDefault(lastSet.WeightKg, lastSet.Reps, lastSet.RepsInReserve, lastSet.RPE);
                });

        return Result<IReadOnlyDictionary<Guid, LastSetDefault>>.Success(defaults);
    }
}
