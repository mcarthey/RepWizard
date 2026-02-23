using MediatR;
using RepWizard.Core.Common;
using RepWizard.Core.Enums;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Programs.GetTodayScheduledWorkout;

public class GetTodayScheduledWorkoutQueryHandler
    : IRequestHandler<GetTodayScheduledWorkoutQuery, Result<ScheduledWorkoutDto?>>
{
    private readonly ITrainingProgramRepository _programs;

    public GetTodayScheduledWorkoutQueryHandler(ITrainingProgramRepository programs)
    {
        _programs = programs;
    }

    public async Task<Result<ScheduledWorkoutDto?>> Handle(
        GetTodayScheduledWorkoutQuery request,
        CancellationToken cancellationToken)
    {
        var program = await _programs.GetActiveForUserAsync(request.UserId, cancellationToken);
        if (program == null)
            return Result<ScheduledWorkoutDto?>.Success(null);

        var currentWeek = program.GetCurrentWeek();
        if (currentWeek == null)
            return Result<ScheduledWorkoutDto?>.Success(null);

        var todayEnum = ToDayOfWeekEnum(DateTime.Now.DayOfWeek);
        var todayDay = currentWeek.Days.FirstOrDefault(d => d.DayOfWeek == todayEnum);

        if (todayDay == null)
        {
            // No entry for today — treat as rest day
            return Result<ScheduledWorkoutDto?>.Success(new ScheduledWorkoutDto
            {
                ProgramName = program.Name,
                CurrentWeekNumber = currentWeek.WeekNumber,
                TotalWeeks = program.DurationWeeks,
                IsDeloadWeek = currentWeek.DeloadWeek,
                IsRestDay = true
            });
        }

        return Result<ScheduledWorkoutDto?>.Success(new ScheduledWorkoutDto
        {
            ProgramName = program.Name,
            CurrentWeekNumber = currentWeek.WeekNumber,
            TotalWeeks = program.DurationWeeks,
            IsDeloadWeek = currentWeek.DeloadWeek,
            IsRestDay = todayDay.RestDay,
            Focus = todayDay.Focus,
            WorkoutTemplateName = todayDay.WorkoutTemplate?.Name,
            WorkoutTemplateId = todayDay.WorkoutTemplateId
        });
    }

    internal static DayOfWeekEnum ToDayOfWeekEnum(DayOfWeek dayOfWeek)
    {
        return dayOfWeek == DayOfWeek.Sunday
            ? DayOfWeekEnum.Sunday
            : (DayOfWeekEnum)(int)dayOfWeek;
    }
}
