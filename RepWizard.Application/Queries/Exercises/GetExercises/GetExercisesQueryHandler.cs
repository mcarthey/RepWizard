using MediatR;
using RepWizard.Core.Common;
using RepWizard.Core.Entities;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Exercises.GetExercises;

public class GetExercisesQueryHandler
    : IRequestHandler<GetExercisesQuery, Result<PagedResult<ExerciseDto>>>
{
    private readonly IExerciseRepository _exercises;

    public GetExercisesQueryHandler(IExerciseRepository exercises)
    {
        _exercises = exercises;
    }

    public async Task<Result<PagedResult<ExerciseDto>>> Handle(
        GetExercisesQuery request,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<Exercise> all;

        if (!string.IsNullOrWhiteSpace(request.Search))
            all = await _exercises.SearchAsync(request.Search, cancellationToken);
        else if (request.Category.HasValue)
            all = await _exercises.GetByCategoryAsync(request.Category.Value, cancellationToken);
        else if (request.Equipment.HasValue)
            all = await _exercises.GetByEquipmentAsync(request.Equipment.Value, cancellationToken);
        else
            all = await _exercises.GetAllAsync(cancellationToken);

        var paged = all
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(MapToDto)
            .ToList();

        return Result<PagedResult<ExerciseDto>>.Success(
            new PagedResult<ExerciseDto>(paged, all.Count, request.Page, request.PageSize));
    }

    internal static ExerciseDto MapToDto(Exercise e) => new()
    {
        Id = e.Id,
        Name = e.Name,
        Description = e.Description,
        Category = e.Category.ToString(),
        PrimaryMuscles = e.PrimaryMuscles.Select(m => m.ToString()).ToList(),
        SecondaryMuscles = e.SecondaryMuscles.Select(m => m.ToString()).ToList(),
        Equipment = e.Equipment.ToString(),
        Difficulty = e.Difficulty.ToString(),
        IsCompound = e.IsCompound,
        VideoUrl = e.VideoUrl,
        Instructions = e.Instructions.ToList(),
        ResearchNotes = e.ResearchNotes
    };
}
