using MediatR;
using RepWizard.Application.Queries.Exercises.GetExercises;
using RepWizard.Core.Common;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Workouts.GetSessionHistory;

public record GetSessionHistoryQuery(
    Guid UserId,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<WorkoutHistoryDto>>>;
