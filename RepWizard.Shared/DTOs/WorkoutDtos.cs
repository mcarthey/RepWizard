namespace RepWizard.Shared.DTOs;

public class WorkoutSessionDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Notes { get; set; }
    public Guid? TemplateId { get; set; }
    public string? TemplateName { get; set; }
    public IList<SessionExerciseDto> SessionExercises { get; set; } = new List<SessionExerciseDto>();
    public bool IsActive => CompletedAt == null;
}

public class SessionExerciseDto
{
    public Guid Id { get; set; }
    public Guid ExerciseId { get; set; }
    public string ExerciseName { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
    public string? Notes { get; set; }
    public IList<ExerciseSetDto> Sets { get; set; } = new List<ExerciseSetDto>();
}

public class ExerciseSetDto
{
    public Guid Id { get; set; }
    public int SetNumber { get; set; }
    public decimal? WeightKg { get; set; }
    public int Reps { get; set; }
    public int? RepsInReserve { get; set; }
    public decimal? RPE { get; set; }
    public string SetType { get; set; } = "Working";
    public DateTime? CompletedAt { get; set; }
    public int? DurationSeconds { get; set; }
}

public class StartSessionRequest
{
    public Guid UserId { get; set; }
    public Guid? TemplateId { get; set; }
    public string? Notes { get; set; }
}

public class LogSetRequest
{
    public Guid ExerciseId { get; set; }
    public int SetNumber { get; set; }
    public decimal? WeightKg { get; set; }
    public int Reps { get; set; }
    public int? RepsInReserve { get; set; }
    public decimal? RPE { get; set; }
    public string SetType { get; set; } = "Working";
    public int? DurationSeconds { get; set; }
}

public class WorkoutSummaryDto
{
    public Guid Id { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? TemplateName { get; set; }
    public int TotalSets { get; set; }
    public decimal TotalVolume { get; set; }
    public int DurationMinutes { get; set; }
}
