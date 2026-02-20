using FluentValidation;

namespace RepWizard.Application.Commands.Measurements.LogBodyMeasurement;

public class LogBodyMeasurementCommandValidator : AbstractValidator<LogBodyMeasurementCommand>
{
    public LogBodyMeasurementCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("UserId is required.");

        // At least one measurement value must be provided
        RuleFor(x => x)
            .Must(x => x.WeightKg.HasValue || x.BodyFatPercent.HasValue || x.MuscleKg.HasValue)
            .WithMessage("At least one measurement value (WeightKg, BodyFatPercent, or MuscleKg) must be provided.");

        RuleFor(x => x.WeightKg)
            .GreaterThan(0).WithMessage("WeightKg must be greater than 0.")
            .LessThan(500).WithMessage("WeightKg must be less than 500 kg.")
            .When(x => x.WeightKg.HasValue);

        RuleFor(x => x.BodyFatPercent)
            .InclusiveBetween(3, 60).WithMessage("BodyFatPercent must be between 3% and 60%.")
            .When(x => x.BodyFatPercent.HasValue);

        RuleFor(x => x.MuscleKg)
            .GreaterThan(0).WithMessage("MuscleKg must be greater than 0.")
            .When(x => x.MuscleKg.HasValue);
    }
}
