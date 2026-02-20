using MediatR;
using RepWizard.Core.Common;
using RepWizard.Core.Entities;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Commands.Workouts.StartWorkoutSession;

public class StartWorkoutSessionCommandHandler
    : IRequestHandler<StartWorkoutSessionCommand, Result<WorkoutSessionDto>>
{
    private readonly IWorkoutSessionRepository _sessions;

    public StartWorkoutSessionCommandHandler(IWorkoutSessionRepository sessions)
    {
        _sessions = sessions;
    }

    public async Task<Result<WorkoutSessionDto>> Handle(
        StartWorkoutSessionCommand request,
        CancellationToken cancellationToken)
    {
        // Only one active session per user at a time.
        var existing = await _sessions.GetActiveSessionForUserAsync(request.UserId, cancellationToken);
        if (existing != null)
            return Result<WorkoutSessionDto>.Failure("A session is already active. Complete it before starting a new one.");

        var session = new WorkoutSession
        {
            UserId = request.UserId,
            TemplateId = request.TemplateId,
            Notes = request.Notes,
            StartedAt = DateTime.UtcNow
        };

        await _sessions.AddAsync(session, cancellationToken);
        await _sessions.SaveChangesAsync(cancellationToken);

        return Result<WorkoutSessionDto>.Success(MapToDto(session));
    }

    internal static WorkoutSessionDto MapToDto(WorkoutSession s) => new()
    {
        Id = s.Id,
        UserId = s.UserId,
        StartedAt = s.StartedAt,
        CompletedAt = s.CompletedAt,
        Notes = s.Notes,
        TemplateId = s.TemplateId,
        TemplateName = s.Template?.Name,
        SessionExercises = s.SessionExercises
            .OrderBy(se => se.OrderIndex)
            .Select(se => new SessionExerciseDto
            {
                Id = se.Id,
                ExerciseId = se.ExerciseId,
                ExerciseName = se.Exercise?.Name ?? string.Empty,
                OrderIndex = se.OrderIndex,
                Notes = se.Notes,
                Sets = se.Sets
                    .OrderBy(set => set.SetNumber)
                    .Select(set => new ExerciseSetDto
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
                    }).ToList()
            }).ToList()
    };
}
