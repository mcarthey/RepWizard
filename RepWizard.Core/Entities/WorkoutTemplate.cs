namespace RepWizard.Core.Entities;

/// <summary>
/// Reusable workout plan that can be applied to workout sessions.
/// </summary>
public class WorkoutTemplate : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public int EstimatedDurationMinutes { get; set; }
    public IList<string> Tags { get; set; } = new List<string>();

    // Navigation properties
    public User? User { get; set; }
    public ICollection<TemplateExercise> TemplateExercises { get; set; } = new List<TemplateExercise>();
    public ICollection<ProgramDay> ProgramDays { get; set; } = new List<ProgramDay>();

    /// <summary>
    /// Returns the total estimated set count across all exercises in the template.
    /// </summary>
    public int GetTotalSetCount()
        => TemplateExercises.Sum(te => te.SetCount);

    /// <summary>
    /// Returns all primary muscle groups targeted by exercises in this template.
    /// </summary>
    public IEnumerable<string> GetTargetedMuscles()
        => TemplateExercises
            .Where(te => te.Exercise != null)
            .SelectMany(te => te.Exercise!.PrimaryMuscles)
            .Distinct()
            .Select(m => m.ToString());
}
