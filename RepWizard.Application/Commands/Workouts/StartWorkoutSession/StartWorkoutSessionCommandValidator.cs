using FluentValidation;

namespace RepWizard.Application.Commands.Workouts.StartWorkoutSession;

public class StartWorkoutSessionCommandValidator : AbstractValidator<StartWorkoutSessionCommand>
{
    public StartWorkoutSessionCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("UserId is required.");
    }
}
