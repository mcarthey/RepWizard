using FluentValidation;

namespace RepWizard.Application.Commands.Workouts.LogSet;

public class LogSetCommandValidator : AbstractValidator<LogSetCommand>
{
    public LogSetCommandValidator()
    {
        RuleFor(x => x.SessionId)
            .NotEmpty().WithMessage("SessionId is required.");

        RuleFor(x => x.ExerciseId)
            .NotEmpty().WithMessage("ExerciseId is required.");

        RuleFor(x => x.SetNumber)
            .GreaterThan(0).WithMessage("SetNumber must be greater than 0.");

        RuleFor(x => x.Reps)
            .GreaterThan(0).WithMessage("Reps must be greater than 0.");

        RuleFor(x => x.WeightKg)
            .GreaterThanOrEqualTo(0).WithMessage("WeightKg must be 0 or greater.")
            .When(x => x.WeightKg.HasValue);

        RuleFor(x => x.RPE)
            .InclusiveBetween(1, 10).WithMessage("RPE must be between 1 and 10.")
            .When(x => x.RPE.HasValue);

        RuleFor(x => x.RepsInReserve)
            .InclusiveBetween(0, 10).WithMessage("RepsInReserve must be between 0 and 10.")
            .When(x => x.RepsInReserve.HasValue);
    }
}
