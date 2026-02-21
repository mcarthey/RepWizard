using MediatR;
using RepWizard.Core.Common;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Programs.GetTrainingProgramById;

/// <summary>
/// Retrieves a single training program with its full week-by-week and day-by-day structure.
/// </summary>
public class GetTrainingProgramByIdQueryHandler : IRequestHandler<GetTrainingProgramByIdQuery, Result<TrainingProgramDetailDto>>
{
    private readonly ITrainingProgramRepository _programs;

    public GetTrainingProgramByIdQueryHandler(ITrainingProgramRepository programs)
    {
        _programs = programs;
    }

    public async Task<Result<TrainingProgramDetailDto>> Handle(
        GetTrainingProgramByIdQuery request,
        CancellationToken cancellationToken)
    {
        var program = await _programs.GetWithWeeksAndDaysAsync(request.ProgramId, cancellationToken);
        if (program == null)
            return Result<TrainingProgramDetailDto>.Failure("Training program not found.");

        var dto = new TrainingProgramDetailDto
        {
            Id = program.Id,
            Name = program.Name,
            DurationWeeks = program.DurationWeeks,
            GoalDescription = program.GoalDescription,
            GeneratedByAi = program.GeneratedByAi,
            AiReasoning = program.AiReasoning,
            IsActive = program.IsActive,
            ActivatedAt = program.ActivatedAt,
            Weeks = program.Weeks
                .OrderBy(w => w.WeekNumber)
                .Select(w => new ProgramWeekDto
                {
                    WeekNumber = w.WeekNumber,
                    VolumeMultiplier = w.VolumeMultiplier,
                    DeloadWeek = w.DeloadWeek,
                    Days = w.Days
                        .OrderBy(d => d.DayOfWeek)
                        .Select(d => new ProgramDayDto
                        {
                            DayOfWeek = d.DayOfWeek.ToString(),
                            RestDay = d.RestDay,
                            Focus = d.Focus,
                            WorkoutTemplateName = d.WorkoutTemplate?.Name
                        })
                        .ToList()
                })
                .ToList()
        };

        return Result<TrainingProgramDetailDto>.Success(dto);
    }
}
