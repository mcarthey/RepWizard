using FluentAssertions;
using FluentValidation;
using MediatR;
using RepWizard.Application.Behaviors;
using RepWizard.Core.Common;

namespace RepWizard.Tests.Application.Behaviors;

public class ValidationBehaviorTests
{
    // --- Test request / validator setup ---

    private record TestCommand(string Name, int Value) : IRequest<Result<string>>;

    private class TestCommandValidator : AbstractValidator<TestCommand>
    {
        public TestCommandValidator()
        {
            RuleFor(x => x.Name).NotEmpty().WithMessage("Name is required.");
            RuleFor(x => x.Value).GreaterThan(0).WithMessage("Value must be positive.");
        }
    }

    private static Task<Result<string>> NextDelegate()
        => Task.FromResult(Result<string>.Success("ok"));

    [Fact]
    public async Task Handle_ValidRequest_CallsNext()
    {
        // Arrange
        var behavior = new ValidationBehavior<TestCommand, Result<string>>(
            new[] { new TestCommandValidator() });
        var command = new TestCommand("Alice", 5);
        var nextCalled = false;

        // Act
        var result = await behavior.Handle(
            command,
            _ => { nextCalled = true; return NextDelegate(); },
            default);

        // Assert
        nextCalled.Should().BeTrue();
        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_InvalidRequest_ReturnsFailureWithoutCallingNext()
    {
        // Arrange
        var behavior = new ValidationBehavior<TestCommand, Result<string>>(
            new[] { new TestCommandValidator() });
        var command = new TestCommand("", -1); // Both fields invalid
        var nextCalled = false;

        // Act
        var result = await behavior.Handle(
            command,
            _ => { nextCalled = true; return NextDelegate(); },
            default);

        // Assert
        nextCalled.Should().BeFalse();
        result.IsFailure.Should().BeTrue();
        result.Errors.Should().HaveCount(2);
        result.Errors.Should().Contain("Name is required.");
        result.Errors.Should().Contain("Value must be positive.");
    }

    [Fact]
    public async Task Handle_NoValidators_CallsNext()
    {
        // Arrange — empty validator list
        var behavior = new ValidationBehavior<TestCommand, Result<string>>(
            Enumerable.Empty<IValidator<TestCommand>>());
        var command = new TestCommand("", -99); // Would normally fail
        var nextCalled = false;

        // Act
        var result = await behavior.Handle(
            command,
            _ => { nextCalled = true; return NextDelegate(); },
            default);

        // Assert — no validators means no blocking
        nextCalled.Should().BeTrue();
        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_PartiallyInvalidRequest_ReturnsAllErrors()
    {
        // Arrange
        var behavior = new ValidationBehavior<TestCommand, Result<string>>(
            new[] { new TestCommandValidator() });
        var command = new TestCommand("Valid Name", -5); // Only Value fails

        // Act
        var result = await behavior.Handle(
            command,
            _ => NextDelegate(),
            default);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Errors.Should().ContainSingle()
            .Which.Should().Be("Value must be positive.");
    }
}
