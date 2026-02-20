using FluentAssertions;
using RepWizard.Core.Entities;
using RepWizard.Core.Enums;

namespace RepWizard.Tests.Domain;

/// <summary>
/// Unit tests for User entity business rules and computed properties.
/// </summary>
public class UserEntityTests
{
    [Fact]
    public void User_DefaultValues_AreCorrect()
    {
        // Arrange & Act
        var user = new User
        {
            Name = "Test User",
            Email = "test@example.com"
        };

        // Assert
        user.Id.Should().NotBeEmpty();
        user.FitnessGoal.Should().Be(FitnessGoal.GeneralFitness);
        user.ExperienceLevel.Should().Be(ExperienceLevel.Beginner);
        user.IsDeleted.Should().BeFalse();
        user.SyncState.Should().Be(SyncState.New);
        user.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void User_CalculateAge_ReturnsCorrectAge()
    {
        // Arrange
        var birthDate = DateTime.Today.AddYears(-30);
        var user = new User { Name = "Test", Email = "test@test.com", DateOfBirth = birthDate };

        // Act
        var age = user.CalculateAge();

        // Assert
        age.Should().Be(30);
    }

    [Fact]
    public void User_CalculateAge_ReturnsNullWhenNoBirthDate()
    {
        // Arrange
        var user = new User { Name = "Test", Email = "test@test.com" };

        // Act
        var age = user.CalculateAge();

        // Assert
        age.Should().BeNull();
    }

    [Theory]
    [InlineData(FitnessGoal.StrengthGain)]
    [InlineData(FitnessGoal.MuscleHypertrophy)]
    [InlineData(FitnessGoal.FatLoss)]
    [InlineData(FitnessGoal.GeneralFitness)]
    [InlineData(FitnessGoal.Endurance)]
    [InlineData(FitnessGoal.PowerAndAthletics)]
    [InlineData(FitnessGoal.Rehabilitation)]
    public void User_GetGoalDescription_ReturnsNonEmptyStringForAllGoals(FitnessGoal goal)
    {
        // Arrange
        var user = new User { Name = "Test", Email = "test@test.com", FitnessGoal = goal };

        // Act
        var description = user.GetGoalDescription();

        // Assert
        description.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void User_CalculateAge_HandlesRecentBirthday()
    {
        // Arrange — birthday was yesterday (already had birthday this year)
        var birthDate = new DateTime(DateTime.Today.Year - 25, DateTime.Today.Month, DateTime.Today.Day).AddDays(-1);
        var user = new User { Name = "Test", Email = "test@test.com", DateOfBirth = birthDate };

        // Act
        var age = user.CalculateAge();

        // Assert
        age.Should().Be(25);
    }
}
