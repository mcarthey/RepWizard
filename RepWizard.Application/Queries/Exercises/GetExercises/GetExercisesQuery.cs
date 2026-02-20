using MediatR;
using RepWizard.Core.Common;
using RepWizard.Core.Enums;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Exercises.GetExercises;

public record GetExercisesQuery(
    string? Search,
    ExerciseCategory? Category,
    Equipment? Equipment,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<ExerciseDto>>>;

public record PagedResult<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize);
