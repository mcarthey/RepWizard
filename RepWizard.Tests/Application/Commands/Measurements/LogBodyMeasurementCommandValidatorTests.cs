using FluentAssertions;
using RepWizard.Application.Commands.Measurements.LogBodyMeasurement;

namespace RepWizard.Tests.Application.Commands.Measurements;

public class LogBodyMeasurementCommandValidatorTests
{
    private readonly LogBodyMeasurementCommandValidator _validator = new();

    [Fact]
    public async Task Validate_WeightOnly_PassesValidation()
    {
        var cmd = new LogBodyMeasurementCommand(Guid.NewGuid(), 80m, null, null, null);
        var result = await _validator.ValidateAsync(cmd);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task Validate_AllValues_PassesValidation()
    {
        var cmd = new LogBodyMeasurementCommand(Guid.NewGuid(), 80m, 15m, 68m, "notes");
        var result = await _validator.ValidateAsync(cmd);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task Validate_NoMeasurementValues_FailsValidation()
    {
        var cmd = new LogBodyMeasurementCommand(Guid.NewGuid(), null, null, null, null);
        var result = await _validator.ValidateAsync(cmd);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("At least one measurement"));
    }

    [Fact]
    public async Task Validate_EmptyUserId_FailsValidation()
    {
        var cmd = new LogBodyMeasurementCommand(Guid.Empty, 80m, null, null, null);
        var result = await _validator.ValidateAsync(cmd);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "UserId");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-10)]
    public async Task Validate_ZeroOrNegativeWeight_FailsValidation(decimal weight)
    {
        var cmd = new LogBodyMeasurementCommand(Guid.NewGuid(), weight, null, null, null);
        var result = await _validator.ValidateAsync(cmd);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "WeightKg");
    }

    [Theory]
    [InlineData(1)]   // below physiological minimum
    [InlineData(65)]  // above maximum
    public async Task Validate_BodyFatPercentOutOfRange_FailsValidation(decimal bf)
    {
        var cmd = new LogBodyMeasurementCommand(Guid.NewGuid(), 80m, bf, null, null);
        var result = await _validator.ValidateAsync(cmd);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "BodyFatPercent");
    }

    [Theory]
    [InlineData(3)]   // minimum valid
    [InlineData(60)]  // maximum valid
    public async Task Validate_BodyFatAtBoundary_PassesValidation(decimal bf)
    {
        var cmd = new LogBodyMeasurementCommand(Guid.NewGuid(), 80m, bf, null, null);
        var result = await _validator.ValidateAsync(cmd);
        result.IsValid.Should().BeTrue();
    }
}
