using FluentAssertions;
using RepWizard.Core.Entities;
using RepWizard.Core.Enums;

namespace RepWizard.Tests.Domain;

/// <summary>
/// Unit tests for Exercise entity business logic.
/// </summary>
public class ExerciseEntityTests
{
    [Fact]
    public void Exercise_DefaultValues_AreCorrect()
    {
        // Arrange & Act
        var exercise = new Exercise { Name = "Bench Press", Description = "Chest press" };

        // Assert
        exercise.Id.Should().NotBeEmpty();
        exercise.PrimaryMuscles.Should().NotBeNull().And.BeEmpty();
        exercise.SecondaryMuscles.Should().NotBeNull().And.BeEmpty();
        exercise.Instructions.Should().NotBeNull().And.BeEmpty();
        exercise.IsDeleted.Should().BeFalse();
    }

    [Fact]
    public void Exercise_GetPrimaryMusclesDisplay_ReturnsCommaSeparatedString()
    {
        // Arrange
        var exercise = new Exercise
        {
            Name = "Bench Press",
            Description = "Chest press",
            PrimaryMuscles = new List<MuscleGroup> { MuscleGroup.Chest, MuscleGroup.Triceps, MuscleGroup.Shoulders }
        };

        // Act
        var display = exercise.GetPrimaryMusclesDisplay();

        // Assert
        display.Should().Contain("Chest");
        display.Should().Contain("Triceps");
        display.Should().Contain("Shoulders");
        display.Should().Contain(",");
    }

    [Theory]
    [InlineData(ExerciseCategory.Strength, true, true)]   // High CNS
    [InlineData(ExerciseCategory.Power, true, true)]      // High CNS
    [InlineData(ExerciseCategory.Cardio, true, false)]    // Not high CNS
    [InlineData(ExerciseCategory.Strength, false, false)] // Not compound = not high CNS
    [InlineData(ExerciseCategory.Flexibility, false, false)]
    public void Exercise_IsHighCnsDemand_ReturnsCorrectly(
        ExerciseCategory category, bool isCompound, bool expected)
    {
        // Arrange
        var exercise = new Exercise
        {
            Name = "Test",
            Description = "Test",
            Category = category,
            IsCompound = isCompound
        };

        // Act
        var result = exercise.IsHighCnsDemand();

        // Assert
        result.Should().Be(expected);
    }
}
