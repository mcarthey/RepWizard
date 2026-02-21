using RepWizard.Core.Entities;
using RepWizard.Core.Enums;
using RepWizard.Core.Interfaces.Repositories;
using System.Text.Json;

namespace RepWizard.Application.Services;

/// <summary>
/// Builds structured user context for every AI call.
/// Context includes user profile, recent workouts, current program, volume landmarks,
/// progression trends, and fatigue indicators per spec Section 6.3.
/// </summary>
public class AiContextBuilder
{
    private readonly IWorkoutSessionRepository _sessions;
    private readonly IBodyMeasurementRepository _measurements;
    private readonly ITrainingProgramRepository _programs;
    private readonly IUserRepository _users;

    public AiContextBuilder(
        IWorkoutSessionRepository sessions,
        IBodyMeasurementRepository measurements,
        ITrainingProgramRepository programs,
        IUserRepository users)
    {
        _sessions = sessions;
        _measurements = measurements;
        _programs = programs;
        _users = users;
    }

    public async Task<string> BuildContextAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _users.GetByIdAsync(userId, ct);
        var recentSessions = await _sessions.GetRecentSessionsAsync(userId, 14, ct);
        var latestMeasurement = await _measurements.GetLatestForUserAsync(userId, ct);
        var activeProgram = await _programs.GetActiveForUserAsync(userId, ct);

        var context = new AiUserContext
        {
            User = BuildUserContext(user),
            RecentWorkouts = BuildWorkoutSummaries(recentSessions),
            CurrentProgram = BuildProgramContext(activeProgram),
            VolumeLandmarks = BuildVolumeLandmarks(user?.ExperienceLevel),
            WeeklyVolume = CalculateWeeklyVolume(recentSessions),
            FatigueIndicators = BuildFatigueIndicators(recentSessions)
        };

        if (latestMeasurement != null)
            context.User.LatestWeightKg = latestMeasurement.WeightKg;

        return JsonSerializer.Serialize(context, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        });
    }

    private static UserContext BuildUserContext(User? user)
    {
        if (user == null) return new UserContext();
        return new UserContext
        {
            Goal = user.FitnessGoal.ToString(),
            Experience = user.ExperienceLevel.ToString(),
            Age = user.DateOfBirth.HasValue
                ? (int)((DateTime.UtcNow - user.DateOfBirth.Value).TotalDays / 365.25)
                : null,
            LatestWeightKg = user.WeightKg
        };
    }

    private static List<WorkoutSummary> BuildWorkoutSummaries(IReadOnlyList<WorkoutSession> sessions)
    {
        return sessions
            .Where(s => s.CompletedAt.HasValue)
            .OrderByDescending(s => s.StartedAt)
            .Take(10)
            .Select(s => new WorkoutSummary
            {
                Date = s.StartedAt.ToString("yyyy-MM-dd"),
                TemplateName = s.Template?.Name,
                TotalVolume = s.GetTotalVolume(),
                DurationMinutes = (int)s.GetDuration().TotalMinutes,
                ExerciseCount = s.SessionExercises.Count,
                SetCount = s.SessionExercises.SelectMany(se => se.Sets).Count()
            })
            .ToList();
    }

    private static ProgramContext? BuildProgramContext(TrainingProgram? program)
    {
        if (program == null) return null;
        var currentWeek = program.GetCurrentWeek();
        return new ProgramContext
        {
            Name = program.Name,
            CurrentWeek = currentWeek?.WeekNumber ?? 0,
            TotalWeeks = program.DurationWeeks,
            IsDeloadWeek = currentWeek?.DeloadWeek ?? false
        };
    }

    internal static Dictionary<string, VolumeLandmark> BuildVolumeLandmarks(ExperienceLevel? level)
    {
        // MEV/MAV/MRV estimates per muscle group based on experience level
        // Based on RP methodology (Dr. Mike Israetel)
        var (mev, mav, mrv) = level switch
        {
            ExperienceLevel.Beginner or ExperienceLevel.Novice => (6, 10, 12),
            ExperienceLevel.Intermediate => (8, 14, 20),
            ExperienceLevel.Advanced or ExperienceLevel.Elite => (10, 18, 25),
            _ => (6, 10, 16)
        };

        var landmarks = new Dictionary<string, VolumeLandmark>();
        foreach (var muscle in Enum.GetValues<MuscleGroup>())
        {
            if (muscle == MuscleGroup.FullBody) continue;
            landmarks[muscle.ToString()] = new VolumeLandmark { MEV = mev, MAV = mav, MRV = mrv };
        }
        return landmarks;
    }

    private static Dictionary<string, int> CalculateWeeklyVolume(IReadOnlyList<WorkoutSession> sessions)
    {
        var weekStart = DateTime.UtcNow.Date.AddDays(-((int)DateTime.UtcNow.DayOfWeek + 6) % 7);
        var thisWeek = sessions.Where(s => s.StartedAt >= weekStart && s.CompletedAt.HasValue);

        var volume = new Dictionary<string, int>();
        foreach (var session in thisWeek)
        {
            foreach (var exercise in session.SessionExercises)
            {
                var workingSets = exercise.Sets.Count(s => s.SetType == SetType.Working);
                if (exercise.Exercise != null)
                {
                    foreach (var muscle in exercise.Exercise.PrimaryMuscles)
                    {
                        var key = muscle.ToString();
                        volume[key] = volume.GetValueOrDefault(key) + workingSets;
                    }
                }
            }
        }
        return volume;
    }

    internal static FatigueIndicators BuildFatigueIndicators(IReadOnlyList<WorkoutSession> sessions)
    {
        var completed = sessions.Where(s => s.CompletedAt.HasValue).ToList();
        var last7Days = completed.Where(s => s.StartedAt >= DateTime.UtcNow.AddDays(-7)).ToList();

        var lastRestDay = DateTime.UtcNow.Date;
        var sessionDates = completed.Select(s => s.StartedAt.Date).Distinct().OrderByDescending(d => d).ToList();
        var daysSinceRest = 0;
        var checkDate = DateTime.UtcNow.Date;
        foreach (var date in sessionDates)
        {
            if (date == checkDate)
            {
                daysSinceRest++;
                checkDate = checkDate.AddDays(-1);
            }
            else break;
        }

        var avgRpe = last7Days
            .SelectMany(s => s.SessionExercises)
            .SelectMany(se => se.Sets)
            .Where(s => s.RPE.HasValue)
            .Select(s => s.RPE!.Value)
            .DefaultIfEmpty(0)
            .Average();

        return new FatigueIndicators
        {
            DaysSinceLastRest = daysSinceRest,
            SessionsLast7Days = last7Days.Count,
            AverageRpeLast7Days = Math.Round(avgRpe, 1)
        };
    }

    // Context DTOs (internal, serialized to JSON for the AI)
    internal class AiUserContext
    {
        public UserContext User { get; set; } = new();
        public List<WorkoutSummary> RecentWorkouts { get; set; } = new();
        public ProgramContext? CurrentProgram { get; set; }
        public Dictionary<string, VolumeLandmark> VolumeLandmarks { get; set; } = new();
        public Dictionary<string, int> WeeklyVolume { get; set; } = new();
        public FatigueIndicators FatigueIndicators { get; set; } = new();
    }

    internal class UserContext
    {
        public string? Goal { get; set; }
        public string? Experience { get; set; }
        public int? Age { get; set; }
        public decimal? LatestWeightKg { get; set; }
    }

    internal class WorkoutSummary
    {
        public string Date { get; set; } = string.Empty;
        public string? TemplateName { get; set; }
        public decimal TotalVolume { get; set; }
        public int DurationMinutes { get; set; }
        public int ExerciseCount { get; set; }
        public int SetCount { get; set; }
    }

    internal class ProgramContext
    {
        public string Name { get; set; } = string.Empty;
        public int CurrentWeek { get; set; }
        public int TotalWeeks { get; set; }
        public bool IsDeloadWeek { get; set; }
    }

    internal class VolumeLandmark
    {
        public int MEV { get; set; }
        public int MAV { get; set; }
        public int MRV { get; set; }
    }

    internal class FatigueIndicators
    {
        public int DaysSinceLastRest { get; set; }
        public int SessionsLast7Days { get; set; }
        public decimal AverageRpeLast7Days { get; set; }
    }
}
