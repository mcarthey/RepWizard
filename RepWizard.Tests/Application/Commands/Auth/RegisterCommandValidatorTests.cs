using FluentAssertions;
using FluentValidation.TestHelper;
using RepWizard.Application.Commands.Auth.Register;

namespace RepWizard.Tests.Application.Commands.Auth;

public class RegisterCommandValidatorTests
{
    private readonly RegisterCommandValidator _validator = new();

    [Fact]
    public void Validate_ValidCommand_NoErrors()
    {
        var command = new RegisterCommand("Test User", "test@example.com", "password123", null, null);
        var result = _validator.TestValidate(command);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_EmptyName_HasError()
    {
        var command = new RegisterCommand("", "test@example.com", "password123", null, null);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Validate_InvalidEmail_HasError()
    {
        var command = new RegisterCommand("User", "not-an-email", "password123", null, null);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void Validate_ShortPassword_HasError()
    {
        var command = new RegisterCommand("User", "test@example.com", "short", null, null);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Password);
    }

    [Fact]
    public void Validate_EmptyPassword_HasError()
    {
        var command = new RegisterCommand("User", "test@example.com", "", null, null);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Password);
    }
}
