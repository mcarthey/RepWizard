using RepWizard.Core.Enums;

namespace RepWizard.Core.Entities;

/// <summary>
/// A single day within a program week, assigning a workout template or designating rest.
/// </summary>
public class ProgramDay : BaseEntity
{
    public Guid ProgramWeekId { get; set; }
    public DayOfWeekEnum DayOfWeek { get; set; }
    public Guid? WorkoutTemplateId { get; set; }
    public bool RestDay { get; set; } = false;
    public string? Focus { get; set; }

    // Navigation properties
    public ProgramWeek? ProgramWeek { get; set; }
    public WorkoutTemplate? WorkoutTemplate { get; set; }
}
