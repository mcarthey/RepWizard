namespace RepWizard.Shared.DTOs;

public class BodyMeasurementDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public DateTime RecordedAt { get; set; }
    public decimal? WeightKg { get; set; }
    public decimal? BodyFatPercent { get; set; }
    public decimal? MuscleKg { get; set; }
    public decimal? LeanBodyMassKg { get; set; }
    public decimal? FatMassKg { get; set; }
    public string? MeasurementNotes { get; set; }
}

public class LogBodyMeasurementRequest
{
    public Guid UserId { get; set; }
    public decimal? WeightKg { get; set; }
    public decimal? BodyFatPercent { get; set; }
    public decimal? MuscleKg { get; set; }
    public string? MeasurementNotes { get; set; }
}

// Lightweight session summary for history lists
public class WorkoutHistoryDto
{
    public Guid Id { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? TemplateName { get; set; }
    public int ExerciseCount { get; set; }
    public int TotalSets { get; set; }
    public decimal TotalVolume { get; set; }
    public int DurationMinutes { get; set; }
}

// Personal record for an exercise
public class ExercisePRDto
{
    public Guid ExerciseId { get; set; }
    public string ExerciseName { get; set; } = string.Empty;
    public decimal? BestWeightKg { get; set; }
    public int BestReps { get; set; }
    public decimal BestLoad { get; set; }  // weight * reps
    public DateTime AchievedAt { get; set; }
}

// Chart data for progress visualization
public class ProgressChartDataDto
{
    public IList<VolumeDataPoint> WeeklyVolume { get; set; } = new List<VolumeDataPoint>();
    public IList<StrengthDataPoint> StrengthTrends { get; set; } = new List<StrengthDataPoint>();
    public IList<BodyCompositionDataPoint> BodyComposition { get; set; } = new List<BodyCompositionDataPoint>();
}

public class VolumeDataPoint
{
    public DateTime WeekStart { get; set; }
    public decimal TotalVolume { get; set; }
    public int TotalSets { get; set; }
    public int SessionCount { get; set; }
}

public class StrengthDataPoint
{
    public Guid ExerciseId { get; set; }
    public string ExerciseName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public decimal WeightKg { get; set; }
    public int Reps { get; set; }
}

public class BodyCompositionDataPoint
{
    public DateTime RecordedAt { get; set; }
    public decimal? WeightKg { get; set; }
    public decimal? BodyFatPercent { get; set; }
    public decimal? LeanBodyMassKg { get; set; }
}
