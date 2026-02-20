using FluentAssertions;
using RepWizard.Application.Commands.Workouts.LogSet;

namespace RepWizard.Tests.Application.Commands;

public class LogSetCommandValidatorTests
{
    private readonly LogSetCommandValidator _validator = new();

    private static LogSetCommand ValidCommand() => new(
        Guid.NewGuid(), Guid.NewGuid(), 1, 100m, 5, 2, 8m, "Working", null);

    [Fact]
    public async Task Validate_ValidCommand_PassesValidation()
    {
        var result = await _validator.ValidateAsync(ValidCommand());
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task Validate_EmptySessionId_FailsValidation()
    {
        var cmd = ValidCommand() with { SessionId = Guid.Empty };
        var result = await _validator.ValidateAsync(cmd);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "SessionId");
    }

    [Fact]
    public async Task Validate_EmptyExerciseId_FailsValidation()
    {
        var cmd = ValidCommand() with { ExerciseId = Guid.Empty };
        var result = await _validator.ValidateAsync(cmd);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "ExerciseId");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task Validate_ZeroOrNegativeReps_FailsValidation(int reps)
    {
        var cmd = ValidCommand() with { Reps = reps };
        var result = await _validator.ValidateAsync(cmd);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Reps");
    }

    [Fact]
    public async Task Validate_NegativeWeight_FailsValidation()
    {
        var cmd = ValidCommand() with { WeightKg = -1m };
        var result = await _validator.ValidateAsync(cmd);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "WeightKg");
    }

    [Fact]
    public async Task Validate_ZeroWeight_PassesValidation()
    {
        // Bodyweight exercises have 0 weight
        var cmd = ValidCommand() with { WeightKg = 0m };
        var result = await _validator.ValidateAsync(cmd);
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(11)]
    public async Task Validate_RpeOutOfRange_FailsValidation(int rpe)
    {
        var cmd = ValidCommand() with { RPE = rpe };
        var result = await _validator.ValidateAsync(cmd);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "RPE");
    }

    [Fact]
    public async Task Validate_NullRpe_PassesValidation()
    {
        var cmd = ValidCommand() with { RPE = null };
        var result = await _validator.ValidateAsync(cmd);
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(11)]
    public async Task Validate_RirOutOfRange_FailsValidation(int rir)
    {
        var cmd = ValidCommand() with { RepsInReserve = rir };
        var result = await _validator.ValidateAsync(cmd);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "RepsInReserve");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(10)]
    public async Task Validate_RirAtBoundary_PassesValidation(int rir)
    {
        var cmd = ValidCommand() with { RepsInReserve = rir };
        var result = await _validator.ValidateAsync(cmd);
        result.IsValid.Should().BeTrue();
    }
}
