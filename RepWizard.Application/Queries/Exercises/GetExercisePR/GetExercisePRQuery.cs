using MediatR;
using RepWizard.Core.Common;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Exercises.GetExercisePR;

/// <summary>
/// Returns the all-time personal record (best working set by total load) for each
/// exercise the user has logged, optionally filtered to a specific exercise.
/// </summary>
public record GetExercisePRQuery(
    Guid UserId,
    Guid? ExerciseId = null
) : IRequest<Result<IReadOnlyList<ExercisePRDto>>>;
