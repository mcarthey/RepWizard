namespace RepWizard.Shared.DTOs;

public class CreateProgramRequest
{
    public string Name { get; set; } = string.Empty;
    public int DurationWeeks { get; set; }
    public string GoalDescription { get; set; } = string.Empty;
    public bool GeneratedByAi { get; set; }
    public string? AiReasoning { get; set; }
    public bool ActivateImmediately { get; set; }
    public IList<ProgramDayInput> Days { get; set; } = new List<ProgramDayInput>();
}

public class ProgramDayInput
{
    public string DayOfWeek { get; set; } = string.Empty;
    public bool RestDay { get; set; }
    public string? Focus { get; set; }
    public IList<ProgramExerciseInput>? Exercises { get; set; }
}

public class ProgramExerciseInput
{
    public Guid ExerciseId { get; set; }
    public int OrderIndex { get; set; }
    public int SetCount { get; set; } = 3;
    public int MinReps { get; set; } = 8;
    public int MaxReps { get; set; } = 12;
    public int RestSeconds { get; set; } = 120;
    public string ProgressionRule { get; set; } = "DoubleProgression";
}

public class ActivateProgramRequest
{
    public Guid ProgramId { get; set; }
}
