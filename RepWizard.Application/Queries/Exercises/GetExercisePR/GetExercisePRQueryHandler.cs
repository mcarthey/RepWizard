using MediatR;
using RepWizard.Core.Common;
using RepWizard.Core.Enums;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Exercises.GetExercisePR;

public class GetExercisePRQueryHandler
    : IRequestHandler<GetExercisePRQuery, Result<IReadOnlyList<ExercisePRDto>>>
{
    private readonly IWorkoutSessionRepository _sessions;

    public GetExercisePRQueryHandler(IWorkoutSessionRepository sessions)
    {
        _sessions = sessions;
    }

    public async Task<Result<IReadOnlyList<ExercisePRDto>>> Handle(
        GetExercisePRQuery request,
        CancellationToken cancellationToken)
    {
        // Fetch last 3 years worth of sessions for PR calculation
        var allSessions = await _sessions.GetRecentSessionsAsync(request.UserId, 1095, cancellationToken);

        var allSets = allSessions
            .SelectMany(s => s.SessionExercises
                .Where(se => !request.ExerciseId.HasValue || se.ExerciseId == request.ExerciseId)
                .SelectMany(se => se.Sets
                    .Where(set => set.SetType == SetType.Working && set.WeightKg.HasValue)
                    .Select(set => new
                    {
                        se.ExerciseId,
                        ExerciseName = se.Exercise?.Name ?? string.Empty,
                        set.WeightKg,
                        set.Reps,
                        Load = set.GetLoad(),
                        CompletedAt = set.CompletedAt ?? s.StartedAt
                    })));

        var prs = allSets
            .GroupBy(s => s.ExerciseId)
            .Select(g =>
            {
                var best = g.OrderByDescending(s => s.Load).First();
                return new ExercisePRDto
                {
                    ExerciseId = g.Key,
                    ExerciseName = best.ExerciseName,
                    BestWeightKg = best.WeightKg,
                    BestReps = best.Reps,
                    BestLoad = best.Load,
                    AchievedAt = best.CompletedAt
                };
            })
            .OrderByDescending(pr => pr.BestLoad)
            .ToList();

        return Result<IReadOnlyList<ExercisePRDto>>.Success(prs);
    }
}
