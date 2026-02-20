using FluentAssertions;
using RepWizard.Application.Commands.Workouts.StartWorkoutSession;

namespace RepWizard.Tests.Application.Commands;

public class StartWorkoutSessionCommandValidatorTests
{
    private readonly StartWorkoutSessionCommandValidator _validator = new();

    [Fact]
    public async Task Validate_ValidCommand_PassesValidation()
    {
        // Arrange
        var command = new StartWorkoutSessionCommand(Guid.NewGuid(), null, null);

        // Act
        var result = await _validator.ValidateAsync(command);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task Validate_EmptyUserId_FailsValidation()
    {
        // Arrange
        var command = new StartWorkoutSessionCommand(Guid.Empty, null, null);

        // Act
        var result = await _validator.ValidateAsync(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().ContainSingle(e => e.PropertyName == "UserId");
    }

    [Fact]
    public async Task Validate_WithTemplateId_PassesValidation()
    {
        // Arrange
        var command = new StartWorkoutSessionCommand(Guid.NewGuid(), Guid.NewGuid(), "Leg day");

        // Act
        var result = await _validator.ValidateAsync(command);

        // Assert
        result.IsValid.Should().BeTrue();
    }
}
