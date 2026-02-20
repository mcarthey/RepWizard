using MediatR;
using RepWizard.Application.Queries.Exercises.GetExercises;
using RepWizard.Core.Common;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Exercises.GetExerciseById;

public class GetExerciseByIdQueryHandler
    : IRequestHandler<GetExerciseByIdQuery, Result<ExerciseDto>>
{
    private readonly IExerciseRepository _exercises;

    public GetExerciseByIdQueryHandler(IExerciseRepository exercises)
    {
        _exercises = exercises;
    }

    public async Task<Result<ExerciseDto>> Handle(
        GetExerciseByIdQuery request,
        CancellationToken cancellationToken)
    {
        var exercise = await _exercises.GetByIdAsync(request.ExerciseId, cancellationToken);
        if (exercise == null)
            return Result<ExerciseDto>.Failure("Exercise not found.");

        return Result<ExerciseDto>.Success(GetExercisesQueryHandler.MapToDto(exercise));
    }
}
