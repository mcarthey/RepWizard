namespace RepWizard.Core.Entities;

/// <summary>
/// A completed or in-progress workout session.
/// </summary>
public class WorkoutSession : BaseEntity
{
    public Guid UserId { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public string? Notes { get; set; }
    public Guid? TemplateId { get; set; }

    // Navigation properties
    public User? User { get; set; }
    public WorkoutTemplate? Template { get; set; }
    public ICollection<SessionExercise> SessionExercises { get; set; } = new List<SessionExercise>();

    /// <summary>
    /// Returns whether the session is currently active (started but not completed).
    /// </summary>
    public bool IsActive => CompletedAt == null;

    /// <summary>
    /// Returns the duration of the session. Returns elapsed time if still active.
    /// </summary>
    public TimeSpan GetDuration()
    {
        var end = CompletedAt ?? DateTime.UtcNow;
        return end - StartedAt;
    }

    /// <summary>
    /// Returns the total volume (weight × reps) across all sets in the session.
    /// Only counts working sets.
    /// </summary>
    public decimal GetTotalVolume()
        => SessionExercises
            .SelectMany(se => se.Sets)
            .Where(s => s.SetType == Enums.SetType.Working)
            .Sum(s => (s.WeightKg ?? 0) * s.Reps);

    /// <summary>
    /// Completes the session by setting CompletedAt to now.
    /// Throws if the session is already completed.
    /// </summary>
    public void Complete()
    {
        if (CompletedAt.HasValue)
            throw new InvalidOperationException("Session is already completed.");

        CompletedAt = DateTime.UtcNow;
        SyncState = Enums.SyncState.Modified;
    }
}
