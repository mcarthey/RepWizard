namespace RepWizard.Shared.DTOs;

public class PlanInsightDto
{
    public string InsightText { get; set; } = string.Empty;
    public bool HasInsight { get; set; }
}

public class GoalAnalysisDto
{
    public string AnalysisText { get; set; } = string.Empty;
    public bool HasAnalysis { get; set; }
}
