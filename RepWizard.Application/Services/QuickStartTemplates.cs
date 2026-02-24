using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Services;

/// <summary>
/// Curated science-based quick-start program templates.
/// Static data — no DB dependency, available offline.
/// </summary>
public static class QuickStartTemplates
{
    private static readonly IReadOnlyList<QuickStartTemplateDto> _templates = new List<QuickStartTemplateDto>
    {
        new()
        {
            Id = "3day-fullbody",
            Name = "3-Day Full Body",
            Description = "Full-body sessions 3x/week. Ideal for beginners learning compound movements with adequate recovery between sessions.",
            MinExperienceLevel = "Beginner",
            PrimaryGoal = "GeneralFitness",
            DaysPerWeek = 3,
            DurationWeeks = 8,
            SplitType = "FullBody",
            SessionLengthMinutes = 45,
            Tags = new List<string> { "Beginner", "Full Body", "3x/week" }
        },
        new()
        {
            Id = "ppl-hypertrophy",
            Name = "Push / Pull / Legs",
            Description = "Classic 6-day PPL split targeting each muscle group twice per week. High volume for hypertrophy-focused intermediate lifters.",
            MinExperienceLevel = "Intermediate",
            PrimaryGoal = "MuscleHypertrophy",
            DaysPerWeek = 6,
            DurationWeeks = 8,
            SplitType = "PPL",
            SessionLengthMinutes = 60,
            Tags = new List<string> { "Intermediate", "Hypertrophy", "6x/week" }
        },
        new()
        {
            Id = "upper-lower",
            Name = "Upper / Lower Split",
            Description = "4-day upper/lower rotation balancing strength and size. Good recovery between sessions hitting the same muscles.",
            MinExperienceLevel = "Intermediate",
            PrimaryGoal = "StrengthGain",
            DaysPerWeek = 4,
            DurationWeeks = 10,
            SplitType = "UpperLower",
            SessionLengthMinutes = 60,
            Tags = new List<string> { "Intermediate", "Strength + Size", "4x/week" }
        },
        new()
        {
            Id = "531-strength",
            Name = "5/3/1 Strength",
            Description = "Wendler's 5/3/1 progression on main lifts with assistance work. Proven strength builder for intermediate to advanced lifters.",
            MinExperienceLevel = "Intermediate",
            PrimaryGoal = "StrengthGain",
            DaysPerWeek = 4,
            DurationWeeks = 12,
            SplitType = "Custom",
            SessionLengthMinutes = 75,
            Tags = new List<string> { "Intermediate+", "Strength", "4x/week" }
        },
        new()
        {
            Id = "hypertrophy-block",
            Name = "Hypertrophy Block",
            Description = "High-volume mesocycle with progressive overload across 6 weeks. Each muscle group hit 2x/week with escalating sets.",
            MinExperienceLevel = "Intermediate",
            PrimaryGoal = "MuscleHypertrophy",
            DaysPerWeek = 5,
            DurationWeeks = 6,
            SplitType = "Custom",
            SessionLengthMinutes = 60,
            Tags = new List<string> { "Intermediate", "High Volume", "5x/week" }
        }
    };

    public static IReadOnlyList<QuickStartTemplateDto> GetAll() => _templates;

    public static QuickStartTemplateDto? GetById(string id)
        => _templates.FirstOrDefault(t => t.Id == id);
}
