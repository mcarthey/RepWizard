using FluentAssertions;
using RepWizard.Core.Entities;

namespace RepWizard.Tests.Domain;

/// <summary>
/// Unit tests for BodyMeasurement entity calculations and validation.
/// </summary>
public class BodyMeasurementTests
{
    [Fact]
    public void BodyMeasurement_CalculateLeanBodyMass_ReturnsCorrectValue()
    {
        // Arrange — 80kg, 15% body fat
        var measurement = new BodyMeasurement
        {
            UserId = Guid.NewGuid(),
            WeightKg = 80m,
            BodyFatPercent = 15m
        };

        // Act
        var lbm = measurement.CalculateLeanBodyMass();

        // Assert
        lbm.Should().BeApproximately(68m, 0.01m); // 80 * (1 - 0.15) = 68
    }

    [Fact]
    public void BodyMeasurement_CalculateLeanBodyMass_ReturnsNullWhenWeightMissing()
    {
        // Arrange
        var measurement = new BodyMeasurement
        {
            UserId = Guid.NewGuid(),
            BodyFatPercent = 15m
        };

        // Act & Assert
        measurement.CalculateLeanBodyMass().Should().BeNull();
    }

    [Fact]
    public void BodyMeasurement_CalculateLeanBodyMass_ReturnsNullWhenBodyFatMissing()
    {
        // Arrange
        var measurement = new BodyMeasurement
        {
            UserId = Guid.NewGuid(),
            WeightKg = 80m
        };

        // Act & Assert
        measurement.CalculateLeanBodyMass().Should().BeNull();
    }

    [Fact]
    public void BodyMeasurement_CalculateFatMass_ReturnsCorrectValue()
    {
        // Arrange — 80kg, 20% body fat = 16kg fat
        var measurement = new BodyMeasurement
        {
            UserId = Guid.NewGuid(),
            WeightKg = 80m,
            BodyFatPercent = 20m
        };

        // Act
        var fatMass = measurement.CalculateFatMass();

        // Assert
        fatMass.Should().BeApproximately(16m, 0.01m);
    }

    [Theory]
    [InlineData(3, true)]    // Minimum physiologically plausible (competitive bodybuilder)
    [InlineData(15, true)]   // Normal
    [InlineData(35, true)]   // Obese range
    [InlineData(60, true)]   // Maximum
    [InlineData(2, false)]   // Below minimum
    [InlineData(61, false)]  // Above maximum
    public void BodyMeasurement_IsBodyFatPercentValid_ValidatesRange(decimal bodyFat, bool expected)
    {
        // Arrange
        var measurement = new BodyMeasurement
        {
            UserId = Guid.NewGuid(),
            WeightKg = 80m,
            BodyFatPercent = bodyFat
        };

        // Act & Assert
        measurement.IsBodyFatPercentValid().Should().Be(expected);
    }

    [Fact]
    public void BodyMeasurement_IsBodyFatPercentValid_TrueWhenNull()
    {
        // Arrange
        var measurement = new BodyMeasurement
        {
            UserId = Guid.NewGuid(),
            WeightKg = 80m,
            BodyFatPercent = null
        };

        // Act & Assert
        measurement.IsBodyFatPercentValid().Should().BeTrue();
    }
}
