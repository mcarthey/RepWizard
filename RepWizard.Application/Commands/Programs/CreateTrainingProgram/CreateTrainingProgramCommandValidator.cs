using FluentValidation;

namespace RepWizard.Application.Commands.Programs.CreateTrainingProgram;

public class CreateTrainingProgramCommandValidator : AbstractValidator<CreateTrainingProgramCommand>
{
    public CreateTrainingProgramCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty().WithMessage("UserId is required.");
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200).WithMessage("Program name is required (max 200 chars).");
        RuleFor(x => x.DurationWeeks).InclusiveBetween(1, 52).WithMessage("Duration must be between 1 and 52 weeks.");
        RuleFor(x => x.GoalDescription).MaximumLength(1000);
        RuleFor(x => x.Days).NotEmpty().WithMessage("At least one day is required.");
    }
}
