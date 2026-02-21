using RepWizard.Core.Entities;
using RepWizard.Core.Enums;

namespace RepWizard.Application.Services;

/// <summary>
/// Validates AI-generated training programs against science-based constraints
/// per IMPLEMENTATION.md Section 6.5.
/// </summary>
public class ProgramValidator
{
    public ProgramValidationResult Validate(TrainingProgram program, ExperienceLevel level)
    {
        var result = new ProgramValidationResult();

        ValidateDeloadRequirement(program, result);
        ValidateVolumeLimits(program, level, result);
        ValidateCnsLoadRules(program, result);
        ValidateBeginnerConstraints(program, level, result);
        ValidateRecoveryWindows(program, result);

        return result;
    }

    /// <summary>
    /// Programs of 4+ weeks must include at least one deload week (50-60% volume reduction).
    /// </summary>
    private static void ValidateDeloadRequirement(TrainingProgram program, ProgramValidationResult result)
    {
        if (program.DurationWeeks >= 4 && !program.HasRequiredDeloadWeek())
        {
            result.AddViolation("DeloadRequired",
                $"Programs of {program.DurationWeeks} weeks must include at least one deload week " +
                "(50-60% volume reduction). No deload week found.");
        }

        foreach (var week in program.Weeks.Where(w => w.DeloadWeek))
        {
            if (!week.IsVolumeMultiplierValid())
            {
                result.AddViolation("DeloadVolumeInvalid",
                    $"Week {week.WeekNumber} is marked as deload but has volume multiplier " +
                    $"{week.VolumeMultiplier:P0}. Deload weeks should be 40-65% of normal volume.");
            }
        }
    }

    /// <summary>
    /// Weekly volume per muscle group must not exceed MRV for the user's experience level.
    /// Beginners: 10-12 sets/muscle/week max; Intermediate: 16-20; Advanced: 22+.
    /// </summary>
    internal static void ValidateVolumeLimits(
        TrainingProgram program, ExperienceLevel level, ProgramValidationResult result)
    {
        var mrv = level switch
        {
            ExperienceLevel.Beginner or ExperienceLevel.Novice => 12,
            ExperienceLevel.Intermediate => 20,
            ExperienceLevel.Advanced or ExperienceLevel.Elite => 25,
            _ => 16
        };

        foreach (var week in program.Weeks.Where(w => !w.DeloadWeek))
        {
            // Count sets per muscle group across all days in the week
            var trainingDays = week.Days.Where(d => !d.RestDay && d.WorkoutTemplate != null);
            var muscleVolume = new Dictionary<string, int>();

            foreach (var day in trainingDays)
            {
                if (day.WorkoutTemplate?.TemplateExercises == null) continue;
                foreach (var te in day.WorkoutTemplate.TemplateExercises)
                {
                    if (te.Exercise == null) continue;
                    foreach (var muscle in te.Exercise.PrimaryMuscles)
                    {
                        var key = muscle.ToString();
                        muscleVolume[key] = muscleVolume.GetValueOrDefault(key) + te.SetCount;
                    }
                }
            }

            foreach (var (muscle, sets) in muscleVolume)
            {
                if (sets > mrv)
                {
                    result.AddViolation("VolumeExceedsMRV",
                        $"Week {week.WeekNumber}: {muscle} has {sets} sets, exceeding MRV of {mrv} " +
                        $"for {level} level.");
                }
            }
        }
    }

    /// <summary>
    /// No more than 2 consecutive days of high-CNS-demand training
    /// (heavy compounds at 85%+ 1RM, plyometrics, Olympic lifts).
    /// </summary>
    private static void ValidateCnsLoadRules(TrainingProgram program, ProgramValidationResult result)
    {
        foreach (var week in program.Weeks)
        {
            var sortedDays = week.Days.OrderBy(d => d.DayOfWeek).ToList();
            var consecutiveHighCns = 0;

            foreach (var day in sortedDays)
            {
                if (day.RestDay || day.WorkoutTemplate == null)
                {
                    consecutiveHighCns = 0;
                    continue;
                }

                var isHighCns = day.WorkoutTemplate.TemplateExercises
                    .Any(te => te.Exercise?.IsHighCnsDemand() == true);

                if (isHighCns)
                {
                    consecutiveHighCns++;
                    if (consecutiveHighCns > 2)
                    {
                        result.AddViolation("CnsOverload",
                            $"Week {week.WeekNumber}: More than 2 consecutive days of high-CNS-demand " +
                            "training. Add a rest or low-intensity day between heavy sessions.");
                    }
                }
                else
                {
                    consecutiveHighCns = 0;
                }
            }
        }
    }

    /// <summary>
    /// Beginners: 3 full-body sessions/week max to prioritize motor learning.
    /// </summary>
    private static void ValidateBeginnerConstraints(
        TrainingProgram program, ExperienceLevel level, ProgramValidationResult result)
    {
        if (level != ExperienceLevel.Beginner) return;

        foreach (var week in program.Weeks.Where(w => !w.DeloadWeek))
        {
            var trainingDays = week.GetTrainingDayCount();
            if (trainingDays > 3)
            {
                result.AddViolation("BeginnerOvertraining",
                    $"Week {week.WeekNumber}: Beginners should have max 3 training sessions per week " +
                    $"(found {trainingDays}). Prioritize motor learning over split training.");
            }
        }
    }

    /// <summary>
    /// Minimum 48 hours between sessions targeting the same primary muscle group.
    /// </summary>
    private static void ValidateRecoveryWindows(TrainingProgram program, ProgramValidationResult result)
    {
        foreach (var week in program.Weeks)
        {
            var muscleSchedule = new Dictionary<string, List<DayOfWeekEnum>>();

            foreach (var day in week.Days.Where(d => !d.RestDay && d.WorkoutTemplate != null))
            {
                if (day.WorkoutTemplate?.TemplateExercises == null) continue;
                foreach (var te in day.WorkoutTemplate.TemplateExercises)
                {
                    if (te.Exercise == null) continue;
                    foreach (var muscle in te.Exercise.PrimaryMuscles)
                    {
                        var key = muscle.ToString();
                        if (!muscleSchedule.ContainsKey(key))
                            muscleSchedule[key] = new List<DayOfWeekEnum>();
                        muscleSchedule[key].Add(day.DayOfWeek);
                    }
                }
            }

            foreach (var (muscle, days) in muscleSchedule)
            {
                var sorted = days.OrderBy(d => (int)d).ToList();
                for (var i = 1; i < sorted.Count; i++)
                {
                    var gap = (int)sorted[i] - (int)sorted[i - 1];
                    if (gap > 0 && gap < 2) // Less than 48 hours (2 days)
                    {
                        result.AddViolation("InsufficientRecovery",
                            $"Week {week.WeekNumber}: {muscle} is trained on consecutive days " +
                            $"({sorted[i - 1]} and {sorted[i]}). Minimum 48-hour recovery recommended.");
                    }
                }
            }
        }
    }
}

public class ProgramValidationResult
{
    public bool IsValid => Violations.Count == 0;
    public List<ProgramViolation> Violations { get; } = new();

    public void AddViolation(string rule, string message)
    {
        Violations.Add(new ProgramViolation(rule, message));
    }
}

public record ProgramViolation(string Rule, string Message);
