using FluentAssertions;
using Moq;
using RepWizard.Application.Services;
using RepWizard.Core.Entities;
using RepWizard.Core.Enums;
using RepWizard.Core.Interfaces.Repositories;
using System.Text.Json;

namespace RepWizard.Tests.Application.Services;

public class AiContextBuilderTests
{
    private readonly Mock<IWorkoutSessionRepository> _sessionRepo = new();
    private readonly Mock<IBodyMeasurementRepository> _measurementRepo = new();
    private readonly Mock<ITrainingProgramRepository> _programRepo = new();
    private readonly Mock<IUserRepository> _userRepo = new();
    private readonly AiContextBuilder _builder;

    public AiContextBuilderTests()
    {
        _builder = new AiContextBuilder(
            _sessionRepo.Object,
            _measurementRepo.Object,
            _programRepo.Object,
            _userRepo.Object);
    }

    #region Helpers

    private static User BuildUser(
        ExperienceLevel level = ExperienceLevel.Intermediate,
        FitnessGoal goal = FitnessGoal.MuscleHypertrophy,
        DateTime? dob = null,
        decimal? weightKg = null)
    {
        return new User
        {
            Id = Guid.NewGuid(),
            Name = "Test User",
            Email = "test@example.com",
            ExperienceLevel = level,
            FitnessGoal = goal,
            DateOfBirth = dob ?? new DateTime(1990, 1, 1),
            WeightKg = weightKg ?? 80m
        };
    }

    private static WorkoutSession BuildCompletedSession(
        DateTime startedAt,
        int durationMinutes = 60,
        int exerciseCount = 3,
        int setsPerExercise = 3,
        decimal weightKg = 80m,
        int reps = 10,
        decimal? rpe = 8m)
    {
        var session = new WorkoutSession
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            StartedAt = startedAt,
            CompletedAt = startedAt.AddMinutes(durationMinutes)
        };

        for (var e = 0; e < exerciseCount; e++)
        {
            var sessionExercise = new SessionExercise
            {
                Id = Guid.NewGuid(),
                WorkoutSessionId = session.Id,
                ExerciseId = Guid.NewGuid(),
                OrderIndex = e
            };

            for (var s = 0; s < setsPerExercise; s++)
            {
                sessionExercise.Sets.Add(new ExerciseSet
                {
                    Id = Guid.NewGuid(),
                    SessionExerciseId = sessionExercise.Id,
                    SetNumber = s + 1,
                    WeightKg = weightKg,
                    Reps = reps,
                    RPE = rpe,
                    SetType = SetType.Working,
                    CompletedAt = startedAt.AddMinutes(5 * (e * setsPerExercise + s + 1))
                });
            }

            session.SessionExercises.Add(sessionExercise);
        }

        return session;
    }

    private void SetupEmptyRepositories(Guid userId)
    {
        _userRepo.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);
        _sessionRepo.Setup(r => r.GetRecentSessionsAsync(userId, 14, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<WorkoutSession>().AsReadOnly());
        _measurementRepo.Setup(r => r.GetLatestForUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((BodyMeasurement?)null);
        _programRepo.Setup(r => r.GetActiveForUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TrainingProgram?)null);
    }

    #endregion

    [Fact]
    public async Task BuildContextAsync_WithNoData_ReturnsEmptyContext()
    {
        // Arrange
        var userId = Guid.NewGuid();
        SetupEmptyRepositories(userId);

        // Act
        var json = await _builder.BuildContextAsync(userId);

        // Assert
        json.Should().NotBeNullOrWhiteSpace();

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        root.GetProperty("user").GetProperty("goal").ValueKind.Should().Be(JsonValueKind.Null);
        root.GetProperty("user").GetProperty("experience").ValueKind.Should().Be(JsonValueKind.Null);
        root.GetProperty("recentWorkouts").GetArrayLength().Should().Be(0);
        root.GetProperty("currentProgram").ValueKind.Should().Be(JsonValueKind.Null);
        root.GetProperty("weeklyVolume").EnumerateObject().Should().BeEmpty();
    }

    [Fact]
    public async Task BuildContextAsync_WithUserData_IncludesUserContext()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = BuildUser(
            level: ExperienceLevel.Advanced,
            goal: FitnessGoal.StrengthGain,
            dob: new DateTime(1990, 6, 15),
            weightKg: 90m);
        user.Id = userId;

        _userRepo.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _sessionRepo.Setup(r => r.GetRecentSessionsAsync(userId, 14, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<WorkoutSession>().AsReadOnly());
        _measurementRepo.Setup(r => r.GetLatestForUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((BodyMeasurement?)null);
        _programRepo.Setup(r => r.GetActiveForUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TrainingProgram?)null);

        // Act
        var json = await _builder.BuildContextAsync(userId);

        // Assert
        using var doc = JsonDocument.Parse(json);
        var userCtx = doc.RootElement.GetProperty("user");

        userCtx.GetProperty("goal").GetString().Should().Be("StrengthGain");
        userCtx.GetProperty("experience").GetString().Should().Be("Advanced");
        userCtx.GetProperty("age").GetInt32().Should().BeGreaterThan(30);
        userCtx.GetProperty("latestWeightKg").GetDecimal().Should().Be(90m);
    }

    [Fact]
    public async Task BuildContextAsync_WithRecentWorkouts_IncludesWorkoutSummaries()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = BuildUser();
        user.Id = userId;

        var sessions = new List<WorkoutSession>
        {
            BuildCompletedSession(DateTime.UtcNow.AddDays(-1), durationMinutes: 55, exerciseCount: 4, setsPerExercise: 3, weightKg: 80m, reps: 10),
            BuildCompletedSession(DateTime.UtcNow.AddDays(-3), durationMinutes: 45, exerciseCount: 3, setsPerExercise: 4, weightKg: 60m, reps: 12)
        };

        _userRepo.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _sessionRepo.Setup(r => r.GetRecentSessionsAsync(userId, 14, It.IsAny<CancellationToken>()))
            .ReturnsAsync(sessions.AsReadOnly());
        _measurementRepo.Setup(r => r.GetLatestForUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((BodyMeasurement?)null);
        _programRepo.Setup(r => r.GetActiveForUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TrainingProgram?)null);

        // Act
        var json = await _builder.BuildContextAsync(userId);

        // Assert
        using var doc = JsonDocument.Parse(json);
        var workouts = doc.RootElement.GetProperty("recentWorkouts");

        workouts.GetArrayLength().Should().Be(2);

        // First workout (most recent) should be the -1 day session
        var first = workouts[0];
        first.GetProperty("durationMinutes").GetInt32().Should().Be(55);
        first.GetProperty("exerciseCount").GetInt32().Should().Be(4);
        first.GetProperty("setCount").GetInt32().Should().Be(12); // 4 exercises * 3 sets
        first.GetProperty("totalVolume").GetDecimal().Should().BeGreaterThan(0);
    }

    [Fact]
    public void BuildVolumeLandmarks_ForBeginner_ReturnsLowerMRV()
    {
        // Act
        var landmarks = AiContextBuilder.BuildVolumeLandmarks(ExperienceLevel.Beginner);

        // Assert
        landmarks.Should().NotBeEmpty();

        // Beginner MRV is 12 per the switch expression in AiContextBuilder
        var chestLandmark = landmarks[MuscleGroup.Chest.ToString()];
        chestLandmark.MEV.Should().Be(6);
        chestLandmark.MAV.Should().Be(10);
        chestLandmark.MRV.Should().Be(12);

        // FullBody should be excluded
        landmarks.Should().NotContainKey(MuscleGroup.FullBody.ToString());
    }

    [Fact]
    public void BuildVolumeLandmarks_ForAdvanced_ReturnsHigherMRV()
    {
        // Act
        var landmarks = AiContextBuilder.BuildVolumeLandmarks(ExperienceLevel.Advanced);

        // Assert
        landmarks.Should().NotBeEmpty();

        // Advanced MRV is 25 per the switch expression in AiContextBuilder
        var backLandmark = landmarks[MuscleGroup.Back.ToString()];
        backLandmark.MEV.Should().Be(10);
        backLandmark.MAV.Should().Be(18);
        backLandmark.MRV.Should().Be(25);

        // Elite should yield the same values as Advanced
        var eliteLandmarks = AiContextBuilder.BuildVolumeLandmarks(ExperienceLevel.Elite);
        eliteLandmarks[MuscleGroup.Back.ToString()].MRV.Should().Be(25);
    }

    [Fact]
    public void BuildFatigueIndicators_WithRecentSessions_CalculatesCorrectly()
    {
        // Arrange - 3 consecutive days of training ending today
        var sessions = new List<WorkoutSession>
        {
            BuildCompletedSession(DateTime.UtcNow.Date.AddHours(10), rpe: 8.5m),    // today
            BuildCompletedSession(DateTime.UtcNow.Date.AddDays(-1).AddHours(10), rpe: 9m), // yesterday
            BuildCompletedSession(DateTime.UtcNow.Date.AddDays(-2).AddHours(10), rpe: 7.5m), // 2 days ago
            BuildCompletedSession(DateTime.UtcNow.Date.AddDays(-5).AddHours(10), rpe: 7m),   // 5 days ago (within 7 days)
        };

        // Act
        var indicators = AiContextBuilder.BuildFatigueIndicators(sessions.AsReadOnly());

        // Assert
        // 3 consecutive days of training (today, yesterday, day before)
        indicators.DaysSinceLastRest.Should().Be(3);

        // All 4 sessions are within last 7 days
        indicators.SessionsLast7Days.Should().Be(4);

        // Average RPE should be calculated from all sets in last 7 days
        indicators.AverageRpeLast7Days.Should().BeGreaterThan(0);
        indicators.AverageRpeLast7Days.Should().BeLessThanOrEqualTo(10);
    }

    [Fact]
    public async Task BuildContextAsync_WithGoalFields_IncludesGoalsInContext()
    {
        var userId = Guid.NewGuid();
        var user = BuildUser();
        user.Id = userId;
        user.LongTermGoalText = "Build muscle mass";
        user.LongTermGoalMonths = 6;
        user.ShortTermFocusText = "Increase squat 1RM";
        user.ShortTermFocusWeeks = 8;
        user.AvailableDaysPerWeek = 4;
        user.SessionLengthMinutes = 60;
        user.AvailableEquipment = "Full gym";
        user.MovementLimitations = "Left shoulder impingement";

        _userRepo.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _sessionRepo.Setup(r => r.GetRecentSessionsAsync(userId, 14, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<WorkoutSession>().AsReadOnly());
        _measurementRepo.Setup(r => r.GetLatestForUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((BodyMeasurement?)null);
        _programRepo.Setup(r => r.GetActiveForUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TrainingProgram?)null);

        var json = await _builder.BuildContextAsync(userId);

        using var doc = JsonDocument.Parse(json);
        var userCtx = doc.RootElement.GetProperty("user");

        userCtx.GetProperty("longTermGoal").GetString().Should().Be("Build muscle mass");
        userCtx.GetProperty("longTermGoalMonths").GetInt32().Should().Be(6);
        userCtx.GetProperty("shortTermFocus").GetString().Should().Be("Increase squat 1RM");
        userCtx.GetProperty("shortTermFocusWeeks").GetInt32().Should().Be(8);
        userCtx.GetProperty("availableDaysPerWeek").GetInt32().Should().Be(4);
        userCtx.GetProperty("sessionLengthMinutes").GetInt32().Should().Be(60);
        userCtx.GetProperty("availableEquipment").GetString().Should().Be("Full gym");
        userCtx.GetProperty("movementLimitations").GetString().Should().Be("Left shoulder impingement");
    }
}
