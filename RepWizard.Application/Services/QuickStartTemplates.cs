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
            Tags = new List<string> { "Beginner", "Full Body", "3x/week" },
            Days = new List<TemplateDayDto>
            {
                new() { Focus = "Full Body", ExerciseNames = new List<string> { "Barbell Back Squat", "Barbell Bench Press", "Barbell Row", "Overhead Press (Barbell)", "Romanian Deadlift" } },
                new() { Focus = "Full Body", ExerciseNames = new List<string> { "Leg Press", "Incline Dumbbell Press", "Pull-Up / Chin-Up", "Lateral Raise", "Hip Thrust" } },
                new() { Focus = "Full Body", ExerciseNames = new List<string> { "Conventional Deadlift", "Dumbbell Overhead Press", "Single-Arm Dumbbell Row", "Walking Lunge", "Plank" } }
            }
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
            Tags = new List<string> { "Intermediate", "Hypertrophy", "6x/week" },
            Days = new List<TemplateDayDto>
            {
                new() { Focus = "Push", ExerciseNames = new List<string> { "Barbell Bench Press", "Incline Dumbbell Press", "Overhead Press (Barbell)", "Lateral Raise", "Tricep Pushdown" } },
                new() { Focus = "Pull", ExerciseNames = new List<string> { "Barbell Row", "Pull-Up / Chin-Up", "Lat Pulldown", "Face Pull", "Barbell Curl" } },
                new() { Focus = "Legs", ExerciseNames = new List<string> { "Barbell Back Squat", "Romanian Deadlift", "Leg Press", "Leg Curl", "Standing Calf Raise" } },
                new() { Focus = "Push", ExerciseNames = new List<string> { "Dumbbell Overhead Press", "Cable Fly", "Dip", "Lateral Raise", "Skull Crusher" } },
                new() { Focus = "Pull", ExerciseNames = new List<string> { "Single-Arm Dumbbell Row", "Seated Cable Row", "Face Pull", "Hammer Curl", "Rear Delt Fly" } },
                new() { Focus = "Legs", ExerciseNames = new List<string> { "Leg Press", "Hip Thrust", "Walking Lunge", "Leg Extension", "Standing Calf Raise" } }
            }
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
            Tags = new List<string> { "Intermediate", "Strength + Size", "4x/week" },
            Days = new List<TemplateDayDto>
            {
                new() { Focus = "Upper", ExerciseNames = new List<string> { "Barbell Bench Press", "Barbell Row", "Overhead Press (Barbell)", "Pull-Up / Chin-Up", "Lateral Raise" } },
                new() { Focus = "Lower", ExerciseNames = new List<string> { "Barbell Back Squat", "Romanian Deadlift", "Leg Press", "Leg Curl", "Standing Calf Raise" } },
                new() { Focus = "Upper", ExerciseNames = new List<string> { "Incline Dumbbell Press", "Single-Arm Dumbbell Row", "Dumbbell Overhead Press", "Face Pull", "Hammer Curl" } },
                new() { Focus = "Lower", ExerciseNames = new List<string> { "Conventional Deadlift", "Leg Press", "Hip Thrust", "Leg Extension", "Standing Calf Raise" } }
            }
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
            Tags = new List<string> { "Intermediate+", "Strength", "4x/week" },
            Days = new List<TemplateDayDto>
            {
                new() { Focus = "Squat Day", ExerciseNames = new List<string> { "Barbell Back Squat", "Leg Press", "Leg Curl", "Plank" } },
                new() { Focus = "Bench Day", ExerciseNames = new List<string> { "Barbell Bench Press", "Incline Dumbbell Press", "Dip", "Tricep Pushdown" } },
                new() { Focus = "Deadlift Day", ExerciseNames = new List<string> { "Conventional Deadlift", "Barbell Row", "Pull-Up / Chin-Up", "Hanging Leg Raise" } },
                new() { Focus = "Press Day", ExerciseNames = new List<string> { "Overhead Press (Barbell)", "Lateral Raise", "Face Pull", "Barbell Curl" } }
            }
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
            Tags = new List<string> { "Intermediate", "High Volume", "5x/week" },
            Days = new List<TemplateDayDto>
            {
                new() { Focus = "Push", ExerciseNames = new List<string> { "Barbell Bench Press", "Incline Dumbbell Press", "Overhead Press (Barbell)", "Lateral Raise", "Tricep Pushdown" } },
                new() { Focus = "Pull", ExerciseNames = new List<string> { "Barbell Row", "Pull-Up / Chin-Up", "Seated Cable Row", "Face Pull", "Barbell Curl" } },
                new() { Focus = "Legs", ExerciseNames = new List<string> { "Barbell Back Squat", "Romanian Deadlift", "Leg Press", "Leg Curl", "Standing Calf Raise" } },
                new() { Focus = "Upper", ExerciseNames = new List<string> { "Dumbbell Overhead Press", "Single-Arm Dumbbell Row", "Cable Fly", "Rear Delt Fly", "Hammer Curl" } },
                new() { Focus = "Lower", ExerciseNames = new List<string> { "Conventional Deadlift", "Hip Thrust", "Walking Lunge", "Leg Extension", "Standing Calf Raise" } }
            }
        }
    };

    public static IReadOnlyList<QuickStartTemplateDto> GetAll() => _templates;

    public static QuickStartTemplateDto? GetById(string id)
        => _templates.FirstOrDefault(t => t.Id == id);
}
