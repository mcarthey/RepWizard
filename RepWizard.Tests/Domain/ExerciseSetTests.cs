using FluentAssertions;
using RepWizard.Core.Entities;

namespace RepWizard.Tests.Domain;

/// <summary>
/// Unit tests for ExerciseSet entity — RPE/RIR validation and calculations.
/// </summary>
public class ExerciseSetTests
{
    [Theory]
    [InlineData(1, true)]
    [InlineData(5, true)]
    [InlineData(10, true)]
    [InlineData(0, false)]
    [InlineData(11, false)]
    public void ExerciseSet_IsRpeValid_ValidatesCorrectly(decimal rpe, bool expected)
    {
        // Arrange
        var set = new ExerciseSet { WeightKg = 100, Reps = 5, RPE = rpe };

        // Act & Assert
        set.IsRpeValid().Should().Be(expected);
    }

    [Fact]
    public void ExerciseSet_IsRpeValid_TrueWhenNull()
    {
        // Arrange
        var set = new ExerciseSet { WeightKg = 100, Reps = 5, RPE = null };

        // Act & Assert
        set.IsRpeValid().Should().BeTrue();
    }

    [Theory]
    [InlineData(0, true)]
    [InlineData(3, true)]
    [InlineData(10, true)]
    [InlineData(-1, false)]
    [InlineData(11, false)]
    public void ExerciseSet_IsRirValid_ValidatesCorrectly(int rir, bool expected)
    {
        // Arrange
        var set = new ExerciseSet { WeightKg = 100, Reps = 5, RepsInReserve = rir };

        // Act & Assert
        set.IsRirValid().Should().Be(expected);
    }

    [Fact]
    public void ExerciseSet_GetLoad_ReturnsWeightTimesReps()
    {
        // Arrange
        var set = new ExerciseSet { WeightKg = 100, Reps = 8 };

        // Act
        var load = set.GetLoad();

        // Assert
        load.Should().Be(800m);
    }

    [Fact]
    public void ExerciseSet_GetLoad_ReturnsZeroWhenNoWeight()
    {
        // Arrange
        var set = new ExerciseSet { WeightKg = null, Reps = 10 };

        // Act
        var load = set.GetLoad();

        // Assert
        load.Should().Be(0m);
    }

    [Theory]
    [InlineData(0, 10.0)]
    [InlineData(1, 9.0)]
    [InlineData(2, 8.0)]
    [InlineData(3, 7.0)]
    [InlineData(4, 6.0)]
    public void ExerciseSet_EstimateRpeFromRir_ConvertsCorrectly(int rir, double expectedRpe)
    {
        // Arrange
        var set = new ExerciseSet { WeightKg = 100, Reps = 5, RepsInReserve = rir };

        // Act
        var rpe = set.EstimateRpeFromRir();

        // Assert
        rpe.Should().Be((decimal)expectedRpe);
    }

    [Fact]
    public void ExerciseSet_EstimateRpeFromRir_ReturnsNullForHighRir()
    {
        // Arrange — RIR >= 5 is beyond the conversion table
        var set = new ExerciseSet { WeightKg = 100, Reps = 5, RepsInReserve = 5 };

        // Act
        var rpe = set.EstimateRpeFromRir();

        // Assert
        rpe.Should().BeNull();
    }
}
