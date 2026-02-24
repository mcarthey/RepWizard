using FluentAssertions;
using FluentValidation.TestHelper;
using RepWizard.Application.Commands.Programs.CreateTrainingProgram;
using RepWizard.Shared.DTOs;

namespace RepWizard.Tests.Application.Commands.Programs;

public class CreateTrainingProgramCommandValidatorTests
{
    private readonly CreateTrainingProgramCommandValidator _validator = new();

    [Fact]
    public void Validate_ValidCommand_Passes()
    {
        var command = new CreateTrainingProgramCommand(
            UserId: Guid.NewGuid(),
            Name: "Test Program",
            DurationWeeks: 8,
            GoalDescription: "Build strength",
            GeneratedByAi: false,
            AiReasoning: null,
            ActivateImmediately: false,
            Days: new List<ProgramDayInput>
            {
                new() { DayOfWeek = "Monday", RestDay = false, Focus = "Upper" }
            });

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_EmptyName_Fails()
    {
        var command = new CreateTrainingProgramCommand(
            UserId: Guid.NewGuid(),
            Name: "",
            DurationWeeks: 8,
            GoalDescription: "Test",
            GeneratedByAi: false,
            AiReasoning: null,
            ActivateImmediately: false,
            Days: new List<ProgramDayInput>
            {
                new() { DayOfWeek = "Monday", RestDay = false, Focus = "Upper" }
            });

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Validate_EmptyUserId_Fails()
    {
        var command = new CreateTrainingProgramCommand(
            UserId: Guid.Empty,
            Name: "Test",
            DurationWeeks: 8,
            GoalDescription: "Test",
            GeneratedByAi: false,
            AiReasoning: null,
            ActivateImmediately: false,
            Days: new List<ProgramDayInput>
            {
                new() { DayOfWeek = "Monday" }
            });

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.UserId);
    }

    [Fact]
    public void Validate_ZeroWeeks_Fails()
    {
        var command = new CreateTrainingProgramCommand(
            UserId: Guid.NewGuid(),
            Name: "Test",
            DurationWeeks: 0,
            GoalDescription: "Test",
            GeneratedByAi: false,
            AiReasoning: null,
            ActivateImmediately: false,
            Days: new List<ProgramDayInput>
            {
                new() { DayOfWeek = "Monday" }
            });

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.DurationWeeks);
    }

    [Fact]
    public void Validate_EmptyDays_Fails()
    {
        var command = new CreateTrainingProgramCommand(
            UserId: Guid.NewGuid(),
            Name: "Test",
            DurationWeeks: 8,
            GoalDescription: "Test",
            GeneratedByAi: false,
            AiReasoning: null,
            ActivateImmediately: false,
            Days: new List<ProgramDayInput>());

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Days);
    }
}
