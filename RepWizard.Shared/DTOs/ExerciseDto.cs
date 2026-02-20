namespace RepWizard.Shared.DTOs;

public class ExerciseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public IList<string> PrimaryMuscles { get; set; } = new List<string>();
    public IList<string> SecondaryMuscles { get; set; } = new List<string>();
    public string Equipment { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public bool IsCompound { get; set; }
    public string? VideoUrl { get; set; }
    public IList<string> Instructions { get; set; } = new List<string>();
    public string? ResearchNotes { get; set; }
}
