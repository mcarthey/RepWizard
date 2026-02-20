namespace RepWizard.Core.Entities;

/// <summary>
/// Body composition measurement snapshot for progress tracking.
/// </summary>
public class BodyMeasurement : BaseEntity
{
    public Guid UserId { get; set; }
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
    public decimal? WeightKg { get; set; }
    public decimal? BodyFatPercent { get; set; }
    public decimal? MuscleKg { get; set; }
    public string? MeasurementNotes { get; set; }
    public IList<string> Photos { get; set; } = new List<string>();

    // Navigation properties
    public User? User { get; set; }

    /// <summary>
    /// Calculates lean body mass from weight and body fat percentage.
    /// Returns null if either value is missing.
    /// </summary>
    public decimal? CalculateLeanBodyMass()
    {
        if (WeightKg == null || BodyFatPercent == null) return null;
        return WeightKg.Value * (1 - BodyFatPercent.Value / 100);
    }

    /// <summary>
    /// Calculates estimated fat mass from weight and body fat percentage.
    /// Returns null if either value is missing.
    /// </summary>
    public decimal? CalculateFatMass()
    {
        if (WeightKg == null || BodyFatPercent == null) return null;
        return WeightKg.Value * (BodyFatPercent.Value / 100);
    }

    /// <summary>
    /// Validates body fat percentage is within physiologically plausible range.
    /// </summary>
    public bool IsBodyFatPercentValid()
        => BodyFatPercent == null || (BodyFatPercent >= 3 && BodyFatPercent <= 60);
}
