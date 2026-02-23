namespace RepWizard.Shared.DTOs;

public class TrainingProgramDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DurationWeeks { get; set; }
    public string GoalDescription { get; set; } = string.Empty;
    public bool GeneratedByAi { get; set; }
    public bool IsActive { get; set; }
    public DateTime? ActivatedAt { get; set; }
    public int TotalTrainingDays { get; set; }
}

public class TrainingProgramDetailDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DurationWeeks { get; set; }
    public string GoalDescription { get; set; } = string.Empty;
    public bool GeneratedByAi { get; set; }
    public string? AiReasoning { get; set; }
    public bool IsActive { get; set; }
    public DateTime? ActivatedAt { get; set; }
    public IList<ProgramWeekDto> Weeks { get; set; } = new List<ProgramWeekDto>();
}

public class ProgramWeekDto
{
    public int WeekNumber { get; set; }
    public decimal VolumeMultiplier { get; set; }
    public bool DeloadWeek { get; set; }
    public IList<ProgramDayDto> Days { get; set; } = new List<ProgramDayDto>();
}

public class ProgramDayDto
{
    public string DayOfWeek { get; set; } = string.Empty;
    public bool RestDay { get; set; }
    public string? Focus { get; set; }
    public string? WorkoutTemplateName { get; set; }
}

public class ScheduledWorkoutDto
{
    public string ProgramName { get; set; } = string.Empty;
    public int CurrentWeekNumber { get; set; }
    public int TotalWeeks { get; set; }
    public bool IsDeloadWeek { get; set; }
    public bool IsRestDay { get; set; }
    public string? Focus { get; set; }
    public string? WorkoutTemplateName { get; set; }
    public Guid? WorkoutTemplateId { get; set; }
}
