namespace RepWizard.Shared.DTOs;

public class QuickStartTemplateDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string MinExperienceLevel { get; set; } = string.Empty;
    public string PrimaryGoal { get; set; } = string.Empty;
    public int DaysPerWeek { get; set; }
    public int DurationWeeks { get; set; }
    public string SplitType { get; set; } = string.Empty;
    public int SessionLengthMinutes { get; set; }
    public IList<string> Tags { get; set; } = new List<string>();
    public IList<TemplateDayDto> Days { get; set; } = new List<TemplateDayDto>();
}

public class TemplateDayDto
{
    public string Focus { get; set; } = string.Empty;
    public IList<string> ExerciseNames { get; set; } = new List<string>();
}
