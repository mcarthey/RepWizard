using RepWizard.Core.Enums;

namespace RepWizard.Core.Entities;

/// <summary>
/// An exercise performed within a workout session, containing all logged sets.
/// </summary>
public class SessionExercise : BaseEntity
{
    public Guid WorkoutSessionId { get; set; }
    public Guid ExerciseId { get; set; }
    public int OrderIndex { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public WorkoutSession? WorkoutSession { get; set; }
    public Exercise? Exercise { get; set; }
    public ICollection<ExerciseSet> Sets { get; set; } = new List<ExerciseSet>();

    /// <summary>
    /// Returns the number of completed working sets.
    /// </summary>
    public int GetCompletedWorkingSets()
        => Sets.Count(s => s.SetType == SetType.Working);

    /// <summary>
    /// Returns the best (heaviest) working set by total load (weight * reps).
    /// </summary>
    public ExerciseSet? GetBestSet()
        => Sets
            .Where(s => s.SetType == SetType.Working && s.WeightKg.HasValue)
            .OrderByDescending(s => (s.WeightKg ?? 0) * s.Reps)
            .FirstOrDefault();

    /// <summary>
    /// Returns the total volume for this exercise in this session.
    /// </summary>
    public decimal GetTotalVolume()
        => Sets
            .Where(s => s.SetType == SetType.Working)
            .Sum(s => (s.WeightKg ?? 0) * s.Reps);
}
