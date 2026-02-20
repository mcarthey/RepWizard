using FluentAssertions;
using RepWizard.Core.Entities;

namespace RepWizard.Tests.Domain;

/// <summary>
/// Unit tests for TemplateExercise entity — rep range validation and display.
/// </summary>
public class TemplateExerciseTests
{
    [Theory]
    [InlineData(8, 12, true)]   // Valid: 8-12 rep range
    [InlineData(1, 5, true)]    // Valid: strength range
    [InlineData(15, 20, true)]  // Valid: high rep
    [InlineData(0, 10, false)]  // Invalid: min = 0
    [InlineData(12, 8, false)]  // Invalid: min > max
    [InlineData(-1, 10, false)] // Invalid: negative min
    public void TemplateExercise_IsRepRangeValid_ValidatesCorrectly(int min, int max, bool expected)
    {
        // Arrange
        var te = new TemplateExercise
        {
            WorkoutTemplateId = Guid.NewGuid(),
            ExerciseId = Guid.NewGuid(),
            MinReps = min,
            MaxReps = max
        };

        // Act & Assert
        te.IsRepRangeValid().Should().Be(expected);
    }

    [Fact]
    public void TemplateExercise_GetRepRangeDisplay_FormatsCorrectly()
    {
        // Arrange
        var te = new TemplateExercise
        {
            WorkoutTemplateId = Guid.NewGuid(),
            ExerciseId = Guid.NewGuid(),
            MinReps = 8,
            MaxReps = 12
        };

        // Act
        var display = te.GetRepRangeDisplay();

        // Assert
        display.Should().Be("8-12");
    }
}
