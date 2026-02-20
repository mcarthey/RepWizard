namespace RepWizard.Core.Entities;

/// <summary>
/// A week within a training program, containing daily workout assignments.
/// </summary>
public class ProgramWeek : BaseEntity
{
    public Guid TrainingProgramId { get; set; }
    public int WeekNumber { get; set; }

    /// <summary>
    /// Volume multiplier relative to baseline (1.0 = normal, 0.5-0.6 = deload).
    /// </summary>
    public decimal VolumeMultiplier { get; set; } = 1.0m;

    /// <summary>
    /// Indicates this is a deload week with reduced volume (50-60% of peak).
    /// Per spec: programs of 4+ weeks must include at least one deload week.
    /// </summary>
    public bool DeloadWeek { get; set; } = false;

    // Navigation properties
    public TrainingProgram? TrainingProgram { get; set; }
    public ICollection<ProgramDay> Days { get; set; } = new List<ProgramDay>();

    /// <summary>
    /// Returns the number of training days (non-rest days) in this week.
    /// </summary>
    public int GetTrainingDayCount() => Days.Count(d => !d.RestDay);

    /// <summary>
    /// Validates the volume multiplier is within expected ranges.
    /// Deload weeks should have 0.5-0.6 multiplier; normal weeks 0.8-1.2.
    /// </summary>
    public bool IsVolumeMultiplierValid()
    {
        if (DeloadWeek) return VolumeMultiplier is >= 0.4m and <= 0.65m;
        return VolumeMultiplier is >= 0.7m and <= 1.3m;
    }
}
