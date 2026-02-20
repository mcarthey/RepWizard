using FluentAssertions;
using RepWizard.Core.Entities;

namespace RepWizard.Tests.Domain;

/// <summary>
/// Unit tests for TrainingProgram entity — activation, deload validation, and program rules.
/// </summary>
public class TrainingProgramTests
{
    [Fact]
    public void TrainingProgram_Activate_SetsIsActiveAndActivatedAt()
    {
        // Arrange
        var program = CreateProgram();
        var before = DateTime.UtcNow;

        // Act
        program.Activate();

        // Assert
        program.IsActive.Should().BeTrue();
        program.ActivatedAt.Should().NotBeNull();
        program.ActivatedAt.Should().BeCloseTo(before, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void TrainingProgram_Activate_ThrowsIfAlreadyActive()
    {
        // Arrange
        var program = CreateProgram();
        program.Activate();

        // Act & Assert
        program.Invoking(p => p.Activate())
            .Should().Throw<InvalidOperationException>()
            .WithMessage("*already active*");
    }

    [Fact]
    public void TrainingProgram_Deactivate_SetsIsActiveFalse()
    {
        // Arrange
        var program = CreateProgram();
        program.Activate();

        // Act
        program.Deactivate();

        // Assert
        program.IsActive.Should().BeFalse();
    }

    [Fact]
    public void TrainingProgram_HasRequiredDeloadWeek_TrueForShortPrograms()
    {
        // Arrange — 3 week program doesn't need deload
        var program = CreateProgram(weeks: 3);

        // Act & Assert
        program.HasRequiredDeloadWeek().Should().BeTrue();
    }

    [Fact]
    public void TrainingProgram_HasRequiredDeloadWeek_FalseFor4WeekProgramWithNoDeload()
    {
        // Arrange
        var program = CreateProgram(weeks: 4, includeDeload: false);

        // Act & Assert
        program.HasRequiredDeloadWeek().Should().BeFalse();
    }

    [Fact]
    public void TrainingProgram_HasRequiredDeloadWeek_TrueFor4WeekProgramWithDeload()
    {
        // Arrange
        var program = CreateProgram(weeks: 4, includeDeload: true);

        // Act & Assert
        program.HasRequiredDeloadWeek().Should().BeTrue();
    }

    [Fact]
    public void TrainingProgram_GetCurrentWeek_ReturnsNullWhenNotActive()
    {
        // Arrange
        var program = CreateProgram();

        // Act
        var week = program.GetCurrentWeek();

        // Assert
        week.Should().BeNull();
    }

    [Fact]
    public void TrainingProgram_GetCurrentWeek_ReturnsWeekOneOnActivation()
    {
        // Arrange
        var program = CreateProgram(weeks: 4);
        program.Activate();

        // Act
        var week = program.GetCurrentWeek();

        // Assert
        week.Should().NotBeNull();
        week!.WeekNumber.Should().Be(1);
    }

    [Fact]
    public void TrainingProgram_GetTotalTrainingDays_CountsNonRestDays()
    {
        // Arrange
        var program = CreateProgram(weeks: 2);
        // Each week has 3 training days, 1 rest day
        foreach (var week in program.Weeks)
        {
            week.Days.Add(new ProgramDay { DayOfWeek = Core.Enums.DayOfWeekEnum.Monday, RestDay = false });
            week.Days.Add(new ProgramDay { DayOfWeek = Core.Enums.DayOfWeekEnum.Wednesday, RestDay = false });
            week.Days.Add(new ProgramDay { DayOfWeek = Core.Enums.DayOfWeekEnum.Friday, RestDay = false });
            week.Days.Add(new ProgramDay { DayOfWeek = Core.Enums.DayOfWeekEnum.Sunday, RestDay = true });
        }

        // Act
        var totalDays = program.GetTotalTrainingDays();

        // Assert
        totalDays.Should().Be(6); // 3 training days × 2 weeks
    }

    private static TrainingProgram CreateProgram(int weeks = 4, bool includeDeload = false)
    {
        var program = new TrainingProgram
        {
            UserId = Guid.NewGuid(),
            Name = "Test Program",
            DurationWeeks = weeks,
            GoalDescription = "Build muscle"
        };

        for (int i = 1; i <= weeks; i++)
        {
            var week = new ProgramWeek
            {
                TrainingProgramId = program.Id,
                WeekNumber = i,
                DeloadWeek = includeDeload && i == weeks,
                VolumeMultiplier = (includeDeload && i == weeks) ? 0.5m : 1.0m
            };
            program.Weeks.Add(week);
        }

        return program;
    }
}
