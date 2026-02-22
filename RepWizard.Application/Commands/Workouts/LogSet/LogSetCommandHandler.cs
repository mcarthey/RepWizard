using MediatR;
using RepWizard.Core.Common;
using RepWizard.Core.Entities;
using RepWizard.Core.Enums;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Commands.Workouts.LogSet;

/// <summary>
/// Logs a set to an active workout session.
/// Offline-first: writes to local SQLite only — no API calls from within the handler.
/// If the exercise has not yet been added to this session, it is created automatically.
/// </summary>
public class LogSetCommandHandler : IRequestHandler<LogSetCommand, Result<ExerciseSetDto>>
{
    private readonly IWorkoutSessionRepository _sessions;

    public LogSetCommandHandler(IWorkoutSessionRepository sessions)
    {
        _sessions = sessions;
    }

    public async Task<Result<ExerciseSetDto>> Handle(
        LogSetCommand request,
        CancellationToken cancellationToken)
    {
        var session = await _sessions.GetWithExercisesAndSetsAsync(request.SessionId, cancellationToken);
        if (session == null)
            return Result<ExerciseSetDto>.Failure("Session not found.");

        if (!session.IsActive)
            return Result<ExerciseSetDto>.Failure("Cannot log sets to a completed session.");

        // Find or create the SessionExercise for this exercise.
        var sessionExercise = session.SessionExercises
            .FirstOrDefault(se => se.ExerciseId == request.ExerciseId);

        if (sessionExercise == null)
        {
            sessionExercise = new SessionExercise
            {
                WorkoutSessionId = session.Id,
                ExerciseId = request.ExerciseId,
                OrderIndex = session.SessionExercises.Count
            };
            session.SessionExercises.Add(sessionExercise);
            _sessions.MarkAsNew(sessionExercise);
        }

        if (!Enum.TryParse<SetType>(request.SetType, ignoreCase: true, out var setType))
            setType = SetType.Working;

        var set = new ExerciseSet
        {
            SetNumber = request.SetNumber,
            WeightKg = request.WeightKg,
            Reps = request.Reps,
            RepsInReserve = request.RepsInReserve,
            RPE = request.RPE,
            SetType = setType,
            DurationSeconds = request.DurationSeconds,
            CompletedAt = DateTime.UtcNow
        };

        sessionExercise.Sets.Add(set);
        _sessions.MarkAsNew(set);
        await _sessions.SaveChangesAsync(cancellationToken);

        return Result<ExerciseSetDto>.Success(new ExerciseSetDto
        {
            Id = set.Id,
            SetNumber = set.SetNumber,
            WeightKg = set.WeightKg,
            Reps = set.Reps,
            RepsInReserve = set.RepsInReserve,
            RPE = set.RPE,
            SetType = set.SetType.ToString(),
            CompletedAt = set.CompletedAt,
            DurationSeconds = set.DurationSeconds
        });
    }
}
