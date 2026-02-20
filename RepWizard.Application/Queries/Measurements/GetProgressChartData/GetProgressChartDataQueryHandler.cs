using MediatR;
using RepWizard.Application.Commands.Measurements.LogBodyMeasurement;
using RepWizard.Core.Common;
using RepWizard.Core.Enums;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Measurements.GetProgressChartData;

public class GetProgressChartDataQueryHandler
    : IRequestHandler<GetProgressChartDataQuery, Result<ProgressChartDataDto>>
{
    private readonly IWorkoutSessionRepository _sessions;
    private readonly IBodyMeasurementRepository _measurements;

    public GetProgressChartDataQueryHandler(
        IWorkoutSessionRepository sessions,
        IBodyMeasurementRepository measurements)
    {
        _sessions = sessions;
        _measurements = measurements;
    }

    public async Task<Result<ProgressChartDataDto>> Handle(
        GetProgressChartDataQuery request,
        CancellationToken cancellationToken)
    {
        var days = request.WeeksBack * 7;
        var sessions = await _sessions.GetRecentSessionsAsync(request.UserId, days, cancellationToken);
        var bodyMeasurements = await _measurements.GetForUserAsync(request.UserId, null, cancellationToken);

        // Weekly volume aggregation
        var weeklyVolume = sessions
            .Where(s => s.CompletedAt.HasValue)
            .GroupBy(s => WeekStart(s.StartedAt))
            .OrderBy(g => g.Key)
            .Select(g => new VolumeDataPoint
            {
                WeekStart = g.Key,
                TotalVolume = g.Sum(s => s.GetTotalVolume()),
                TotalSets = g.Sum(s => s.SessionExercises.SelectMany(se => se.Sets).Count()),
                SessionCount = g.Count()
            })
            .ToList();

        // Strength trends — best working set per exercise per session (top 3 by frequency)
        var strengthPoints = sessions
            .Where(s => s.CompletedAt.HasValue)
            .SelectMany(s => s.SessionExercises.Select(se => new { Session = s, SessionExercise = se }))
            .SelectMany(x => x.SessionExercise.Sets
                .Where(set => set.SetType == SetType.Working && set.WeightKg.HasValue)
                .OrderByDescending(set => set.GetLoad())
                .Take(1)
                .Select(set => new StrengthDataPoint
                {
                    ExerciseId = x.SessionExercise.ExerciseId,
                    ExerciseName = x.SessionExercise.Exercise?.Name ?? string.Empty,
                    Date = x.Session.StartedAt,
                    WeightKg = set.WeightKg!.Value,
                    Reps = set.Reps
                }))
            .GroupBy(p => p.ExerciseId)
            .OrderByDescending(g => g.Count()) // most frequently trained first
            .Take(3)
            .SelectMany(g => g.OrderBy(p => p.Date))
            .ToList();

        // Body composition over time
        var bodyComposition = bodyMeasurements
            .OrderBy(m => m.RecordedAt)
            .Select(m => new BodyCompositionDataPoint
            {
                RecordedAt = m.RecordedAt,
                WeightKg = m.WeightKg,
                BodyFatPercent = m.BodyFatPercent,
                LeanBodyMassKg = m.CalculateLeanBodyMass()
            })
            .ToList();

        return Result<ProgressChartDataDto>.Success(new ProgressChartDataDto
        {
            WeeklyVolume = weeklyVolume,
            StrengthTrends = strengthPoints,
            BodyComposition = bodyComposition
        });
    }

    private static DateTime WeekStart(DateTime date)
    {
        // Week starts on Monday
        var diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
        return date.Date.AddDays(-diff);
    }
}
