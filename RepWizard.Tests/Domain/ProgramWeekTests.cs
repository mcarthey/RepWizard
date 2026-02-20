using FluentAssertions;
using RepWizard.Core.Entities;
using RepWizard.Core.Enums;

namespace RepWizard.Tests.Domain;

/// <summary>
/// Unit tests for ProgramWeek entity — volume multiplier validation and deload rules.
/// </summary>
public class ProgramWeekTests
{
    [Theory]
    [InlineData(0.5, true, true)]    // Valid deload (50%)
    [InlineData(0.6, true, true)]    // Valid deload (60%)
    [InlineData(0.4, true, true)]    // Valid deload (40%)
    [InlineData(0.7, true, false)]   // Too high for deload
    [InlineData(1.0, false, true)]   // Valid normal week
    [InlineData(1.2, false, true)]   // Valid overreaching week
    [InlineData(0.6, false, false)]  // Too low for normal week
    [InlineData(1.4, false, false)]  // Too high for normal week
    public void ProgramWeek_IsVolumeMultiplierValid_ValidatesCorrectly(
        decimal multiplier, bool isDeload, bool expected)
    {
        // Arrange
        var week = new ProgramWeek
        {
            TrainingProgramId = Guid.NewGuid(),
            WeekNumber = 1,
            VolumeMultiplier = multiplier,
            DeloadWeek = isDeload
        };

        // Act & Assert
        week.IsVolumeMultiplierValid().Should().Be(expected);
    }

    [Fact]
    public void ProgramWeek_GetTrainingDayCount_CountsOnlyNonRestDays()
    {
        // Arrange
        var week = new ProgramWeek
        {
            TrainingProgramId = Guid.NewGuid(),
            WeekNumber = 1,
            Days = new List<ProgramDay>
            {
                new() { DayOfWeek = DayOfWeekEnum.Monday, RestDay = false },
                new() { DayOfWeek = DayOfWeekEnum.Tuesday, RestDay = true },
                new() { DayOfWeek = DayOfWeekEnum.Wednesday, RestDay = false },
                new() { DayOfWeek = DayOfWeekEnum.Thursday, RestDay = true },
                new() { DayOfWeek = DayOfWeekEnum.Friday, RestDay = false },
                new() { DayOfWeek = DayOfWeekEnum.Saturday, RestDay = true },
                new() { DayOfWeek = DayOfWeekEnum.Sunday, RestDay = true },
            }
        };

        // Act
        var count = week.GetTrainingDayCount();

        // Assert
        count.Should().Be(3);
    }
}
