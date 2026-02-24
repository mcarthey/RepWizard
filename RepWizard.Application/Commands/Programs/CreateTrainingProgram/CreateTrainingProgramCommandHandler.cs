using MediatR;
using RepWizard.Core.Common;
using RepWizard.Core.Entities;
using RepWizard.Core.Enums;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Commands.Programs.CreateTrainingProgram;

public class CreateTrainingProgramCommandHandler
    : IRequestHandler<CreateTrainingProgramCommand, Result<TrainingProgramDetailDto>>
{
    private readonly ITrainingProgramRepository _programs;

    public CreateTrainingProgramCommandHandler(ITrainingProgramRepository programs)
    {
        _programs = programs;
    }

    public async Task<Result<TrainingProgramDetailDto>> Handle(
        CreateTrainingProgramCommand request,
        CancellationToken cancellationToken)
    {
        var program = new TrainingProgram
        {
            UserId = request.UserId,
            Name = request.Name,
            DurationWeeks = request.DurationWeeks,
            GoalDescription = request.GoalDescription,
            GeneratedByAi = request.GeneratedByAi,
            AiReasoning = request.AiReasoning
        };

        // Build weeks: replicate the day pattern for each week.
        // Last week is a deload if duration >= 4 weeks.
        for (var weekNum = 1; weekNum <= request.DurationWeeks; weekNum++)
        {
            var isDeload = request.DurationWeeks >= 4 && weekNum == request.DurationWeeks;
            var week = new ProgramWeek
            {
                TrainingProgramId = program.Id,
                WeekNumber = weekNum,
                DeloadWeek = isDeload,
                VolumeMultiplier = isDeload ? 0.5m : 1.0m
            };

            foreach (var dayInput in request.Days)
            {
                if (!Enum.TryParse<DayOfWeekEnum>(dayInput.DayOfWeek, ignoreCase: true, out var dayEnum))
                    continue;

                var day = new ProgramDay
                {
                    ProgramWeekId = week.Id,
                    DayOfWeek = dayEnum,
                    RestDay = dayInput.RestDay,
                    Focus = dayInput.Focus
                };

                // Create a WorkoutTemplate for training days with exercises
                if (!dayInput.RestDay && dayInput.Exercises is { Count: > 0 })
                {
                    var template = new WorkoutTemplate
                    {
                        Name = $"{request.Name} - {dayInput.Focus ?? dayEnum.ToString()}",
                        Description = dayInput.Focus ?? string.Empty,
                        UserId = request.UserId,
                        EstimatedDurationMinutes = 60
                    };

                    foreach (var ex in dayInput.Exercises)
                    {
                        Enum.TryParse<ProgressionRule>(ex.ProgressionRule, ignoreCase: true, out var rule);
                        template.TemplateExercises.Add(new TemplateExercise
                        {
                            WorkoutTemplateId = template.Id,
                            ExerciseId = ex.ExerciseId,
                            OrderIndex = ex.OrderIndex,
                            SetCount = isDeload ? Math.Max(1, ex.SetCount / 2) : ex.SetCount,
                            MinReps = ex.MinReps,
                            MaxReps = ex.MaxReps,
                            RestSeconds = ex.RestSeconds,
                            ProgressionRule = rule
                        });
                    }

                    day.WorkoutTemplateId = template.Id;
                    day.WorkoutTemplate = template;
                }

                week.Days.Add(day);
            }

            program.Weeks.Add(week);
        }

        if (request.ActivateImmediately)
        {
            await _programs.DeactivateAllForUserAsync(request.UserId, cancellationToken);
            program.Activate();
        }

        await _programs.AddAsync(program, cancellationToken);

        // Mark all child entities as new for EF change tracking (client-generated Guids)
        foreach (var week in program.Weeks)
        {
            _programs.MarkAsNew(week);
            foreach (var day in week.Days)
            {
                _programs.MarkAsNew(day);
                if (day.WorkoutTemplate != null)
                {
                    _programs.MarkAsNew(day.WorkoutTemplate);
                    foreach (var te in day.WorkoutTemplate.TemplateExercises)
                        _programs.MarkAsNew(te);
                }
            }
        }

        await _programs.SaveChangesAsync(cancellationToken);

        return Result<TrainingProgramDetailDto>.Success(MapToDetailDto(program));
    }

    internal static TrainingProgramDetailDto MapToDetailDto(TrainingProgram p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        DurationWeeks = p.DurationWeeks,
        GoalDescription = p.GoalDescription,
        GeneratedByAi = p.GeneratedByAi,
        AiReasoning = p.AiReasoning,
        IsActive = p.IsActive,
        ActivatedAt = p.ActivatedAt,
        Weeks = p.Weeks.OrderBy(w => w.WeekNumber).Select(w => new ProgramWeekDto
        {
            WeekNumber = w.WeekNumber,
            VolumeMultiplier = w.VolumeMultiplier,
            DeloadWeek = w.DeloadWeek,
            Days = w.Days.OrderBy(d => d.DayOfWeek).Select(d => new ProgramDayDto
            {
                DayOfWeek = d.DayOfWeek.ToString(),
                RestDay = d.RestDay,
                Focus = d.Focus,
                WorkoutTemplateName = d.WorkoutTemplate?.Name
            }).ToList()
        }).ToList()
    };
}
