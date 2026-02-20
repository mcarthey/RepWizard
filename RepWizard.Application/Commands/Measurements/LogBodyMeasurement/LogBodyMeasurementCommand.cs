using MediatR;
using RepWizard.Core.Common;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Commands.Measurements.LogBodyMeasurement;

public record LogBodyMeasurementCommand(
    Guid UserId,
    decimal? WeightKg,
    decimal? BodyFatPercent,
    decimal? MuscleKg,
    string? Notes
) : IRequest<Result<BodyMeasurementDto>>;
