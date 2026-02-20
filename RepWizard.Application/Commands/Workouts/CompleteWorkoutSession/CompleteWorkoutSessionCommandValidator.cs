using FluentValidation;

namespace RepWizard.Application.Commands.Workouts.CompleteWorkoutSession;

public class CompleteWorkoutSessionCommandValidator : AbstractValidator<CompleteWorkoutSessionCommand>
{
    public CompleteWorkoutSessionCommandValidator()
    {
        RuleFor(x => x.SessionId)
            .NotEmpty().WithMessage("SessionId is required.");
    }
}
