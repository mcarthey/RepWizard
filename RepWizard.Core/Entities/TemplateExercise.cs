using RepWizard.Core.Enums;

namespace RepWizard.Core.Entities;

/// <summary>
/// Junction entity connecting exercises to workout templates with prescription details.
/// </summary>
public class TemplateExercise : BaseEntity
{
    public Guid WorkoutTemplateId { get; set; }
    public Guid ExerciseId { get; set; }
    public int OrderIndex { get; set; }
    public int SetCount { get; set; }
    public int MinReps { get; set; }
    public int MaxReps { get; set; }
    public int RestSeconds { get; set; } = 120;
    public ProgressionRule ProgressionRule { get; set; } = ProgressionRule.DoubleProgression;
    public string? Notes { get; set; }

    // Navigation properties
    public WorkoutTemplate? WorkoutTemplate { get; set; }
    public Exercise? Exercise { get; set; }

    /// <summary>
    /// Returns the rep range as a display string (e.g., "8-12").
    /// </summary>
    public string GetRepRangeDisplay() => $"{MinReps}-{MaxReps}";

    /// <summary>
    /// Validates that the rep range is valid (min <= max, both positive).
    /// </summary>
    public bool IsRepRangeValid() => MinReps > 0 && MaxReps >= MinReps;
}
