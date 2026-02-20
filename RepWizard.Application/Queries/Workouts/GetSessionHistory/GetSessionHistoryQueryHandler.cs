using MediatR;
using RepWizard.Application.Queries.Exercises.GetExercises;
using RepWizard.Core.Common;
using RepWizard.Core.Entities;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Workouts.GetSessionHistory;

public class GetSessionHistoryQueryHandler
    : IRequestHandler<GetSessionHistoryQuery, Result<PagedResult<WorkoutHistoryDto>>>
{
    private readonly IWorkoutSessionRepository _sessions;

    public GetSessionHistoryQueryHandler(IWorkoutSessionRepository sessions)
    {
        _sessions = sessions;
    }

    public async Task<Result<PagedResult<WorkoutHistoryDto>>> Handle(
        GetSessionHistoryQuery request,
        CancellationToken cancellationToken)
    {
        var (items, totalCount) = await _sessions.GetSessionHistoryAsync(
            request.UserId, request.Page, request.PageSize, cancellationToken);

        var dtos = items.Select(MapToHistoryDto).ToList();

        return Result<PagedResult<WorkoutHistoryDto>>.Success(
            new PagedResult<WorkoutHistoryDto>(dtos, totalCount, request.Page, request.PageSize));
    }

    internal static WorkoutHistoryDto MapToHistoryDto(WorkoutSession s) => new()
    {
        Id = s.Id,
        StartedAt = s.StartedAt,
        CompletedAt = s.CompletedAt,
        TemplateName = s.Template?.Name,
        ExerciseCount = s.SessionExercises.Count,
        TotalSets = s.SessionExercises.SelectMany(se => se.Sets).Count(),
        TotalVolume = s.GetTotalVolume(),
        DurationMinutes = s.CompletedAt.HasValue ? (int)s.GetDuration().TotalMinutes : 0
    };
}
