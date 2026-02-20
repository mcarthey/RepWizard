using RepWizard.Core.Enums;

namespace RepWizard.Core.Entities;

/// <summary>
/// Exercise library entry containing movement details, muscle targets, and research notes.
/// </summary>
public class Exercise : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ExerciseCategory Category { get; set; }
    public IList<MuscleGroup> PrimaryMuscles { get; set; } = new List<MuscleGroup>();
    public IList<MuscleGroup> SecondaryMuscles { get; set; } = new List<MuscleGroup>();
    public Equipment Equipment { get; set; }
    public Difficulty Difficulty { get; set; }
    public bool IsCompound { get; set; }
    public string? VideoUrl { get; set; }
    public IList<string> Instructions { get; set; } = new List<string>();
    public string? ResearchNotes { get; set; }

    // Navigation properties
    public ICollection<TemplateExercise> TemplateExercises { get; set; } = new List<TemplateExercise>();
    public ICollection<SessionExercise> SessionExercises { get; set; } = new List<SessionExercise>();

    /// <summary>
    /// Returns the primary muscles as a comma-separated display string.
    /// </summary>
    public string GetPrimaryMusclesDisplay()
        => string.Join(", ", PrimaryMuscles.Select(m => m.ToString()));

    /// <summary>
    /// Determines if this exercise has high CNS demand (heavy compounds, Olympic lifts, plyometrics).
    /// Used in program validation to enforce CNS fatigue rules.
    /// </summary>
    public bool IsHighCnsDemand()
        => IsCompound && Category is ExerciseCategory.Strength or ExerciseCategory.Power;
}
