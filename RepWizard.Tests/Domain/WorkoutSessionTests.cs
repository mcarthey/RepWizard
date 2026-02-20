using FluentAssertions;
using RepWizard.Core.Entities;
using RepWizard.Core.Enums;

namespace RepWizard.Tests.Domain;

/// <summary>
/// Unit tests for WorkoutSession entity business rules.
/// </summary>
public class WorkoutSessionTests
{
    [Fact]
    public void WorkoutSession_IsActive_TrueWhenNotCompleted()
    {
        // Arrange
        var session = CreateSession();

        // Act & Assert
        session.IsActive.Should().BeTrue();
    }

    [Fact]
    public void WorkoutSession_IsActive_FalseAfterCompletion()
    {
        // Arrange
        var session = CreateSession();

        // Act
        session.Complete();

        // Assert
        session.IsActive.Should().BeFalse();
    }

    [Fact]
    public void WorkoutSession_Complete_SetsCompletedAtToNow()
    {
        // Arrange
        var session = CreateSession();
        var before = DateTime.UtcNow;

        // Act
        session.Complete();

        // Assert
        session.CompletedAt.Should().NotBeNull();
        session.CompletedAt.Should().BeCloseTo(before, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void WorkoutSession_Complete_ThrowsIfAlreadyCompleted()
    {
        // Arrange
        var session = CreateSession();
        session.Complete();

        // Act & Assert
        session.Invoking(s => s.Complete())
            .Should().Throw<InvalidOperationException>()
            .WithMessage("*already completed*");
    }

    [Fact]
    public void WorkoutSession_Complete_MarksAsModifiedForSync()
    {
        // Arrange
        var session = CreateSession();
        session.SyncState = SyncState.Synced;

        // Act
        session.Complete();

        // Assert
        session.SyncState.Should().Be(SyncState.Modified);
    }

    [Fact]
    public void WorkoutSession_GetDuration_ReturnsCorrectDurationForCompleted()
    {
        // Arrange
        var start = DateTime.UtcNow.AddMinutes(-60);
        var end = start.AddMinutes(60);
        var session = new WorkoutSession
        {
            UserId = Guid.NewGuid(),
            StartedAt = start,
            CompletedAt = end
        };

        // Act
        var duration = session.GetDuration();

        // Assert
        duration.Should().BeCloseTo(TimeSpan.FromMinutes(60), TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void WorkoutSession_GetTotalVolume_CalculatesOnlyWorkingSets()
    {
        // Arrange
        var session = CreateSession();
        session.SessionExercises.Add(new SessionExercise
        {
            ExerciseId = Guid.NewGuid(),
            Sets = new List<ExerciseSet>
            {
                new() { WeightKg = 60, Reps = 5, SetType = SetType.Warmup },    // Should NOT count
                new() { WeightKg = 100, Reps = 5, SetType = SetType.Working },  // 500
                new() { WeightKg = 100, Reps = 5, SetType = SetType.Working },  // 500
                new() { WeightKg = 100, Reps = 5, SetType = SetType.Working },  // 500
            }
        });

        // Act
        var totalVolume = session.GetTotalVolume();

        // Assert
        totalVolume.Should().Be(1500m);
    }

    private static WorkoutSession CreateSession() => new()
    {
        UserId = Guid.NewGuid(),
        StartedAt = DateTime.UtcNow.AddMinutes(-30)
    };
}
