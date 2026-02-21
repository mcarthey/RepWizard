using MediatR;
using RepWizard.Core.Common;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Programs.GetTrainingPrograms;

/// <summary>
/// Retrieves all training programs for a given user.
/// </summary>
public class GetTrainingProgramsQueryHandler : IRequestHandler<GetTrainingProgramsQuery, Result<IReadOnlyList<TrainingProgramDto>>>
{
    private readonly ITrainingProgramRepository _programs;

    public GetTrainingProgramsQueryHandler(ITrainingProgramRepository programs)
    {
        _programs = programs;
    }

    public async Task<Result<IReadOnlyList<TrainingProgramDto>>> Handle(
        GetTrainingProgramsQuery request,
        CancellationToken cancellationToken)
    {
        var programs = await _programs.GetForUserAsync(request.UserId, cancellationToken);

        var dtos = programs
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new TrainingProgramDto
            {
                Id = p.Id,
                Name = p.Name,
                DurationWeeks = p.DurationWeeks,
                GoalDescription = p.GoalDescription,
                GeneratedByAi = p.GeneratedByAi,
                IsActive = p.IsActive,
                ActivatedAt = p.ActivatedAt,
                TotalTrainingDays = p.GetTotalTrainingDays()
            })
            .ToList() as IReadOnlyList<TrainingProgramDto>;

        return Result<IReadOnlyList<TrainingProgramDto>>.Success(dtos);
    }
}
