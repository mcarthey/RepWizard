using RepWizard.Core.Enums;

namespace RepWizard.Core.Entities;

/// <summary>
/// An individual set logged during a workout session exercise.
/// </summary>
public class ExerciseSet : BaseEntity
{
    public Guid SessionExerciseId { get; set; }
    public int SetNumber { get; set; }
    public decimal? WeightKg { get; set; }
    public int Reps { get; set; }

    /// <summary>
    /// Reps In Reserve: how many more reps could have been performed (0 = failure, 4+ = very easy).
    /// </summary>
    public int? RepsInReserve { get; set; }

    /// <summary>
    /// Rate of Perceived Exertion: subjective effort scale 1-10 (10 = maximal effort).
    /// </summary>
    public decimal? RPE { get; set; }

    public SetType SetType { get; set; } = SetType.Working;
    public DateTime? CompletedAt { get; set; }
    public int? DurationSeconds { get; set; }

    // Navigation properties
    public SessionExercise? SessionExercise { get; set; }

    /// <summary>
    /// Returns the total load for this set (weight × reps).
    /// Returns 0 if no weight is specified (bodyweight exercises).
    /// </summary>
    public decimal GetLoad() => (WeightKg ?? 0) * Reps;

    /// <summary>
    /// Validates RPE is in valid range (1-10) if specified.
    /// </summary>
    public bool IsRpeValid() => RPE == null || (RPE >= 1 && RPE <= 10);

    /// <summary>
    /// Validates RIR is in valid range (0-10) if specified.
    /// </summary>
    public bool IsRirValid() => RepsInReserve == null || (RepsInReserve >= 0 && RepsInReserve <= 10);

    /// <summary>
    /// Estimates RPE from RIR if RPE is not directly specified.
    /// Based on the RIR-RPE conversion table used in evidence-based programming.
    /// </summary>
    public decimal? EstimateRpeFromRir() => RepsInReserve switch
    {
        0 => 10m,
        1 => 9m,
        2 => 8m,
        3 => 7m,
        4 => 6m,
        _ => null
    };
}
