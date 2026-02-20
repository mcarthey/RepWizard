using MediatR;
using RepWizard.Core.Common;
using RepWizard.Core.Entities;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Commands.Measurements.LogBodyMeasurement;

public class LogBodyMeasurementCommandHandler
    : IRequestHandler<LogBodyMeasurementCommand, Result<BodyMeasurementDto>>
{
    private readonly IBodyMeasurementRepository _measurements;

    public LogBodyMeasurementCommandHandler(IBodyMeasurementRepository measurements)
    {
        _measurements = measurements;
    }

    public async Task<Result<BodyMeasurementDto>> Handle(
        LogBodyMeasurementCommand request,
        CancellationToken cancellationToken)
    {
        var measurement = new BodyMeasurement
        {
            UserId = request.UserId,
            RecordedAt = DateTime.UtcNow,
            WeightKg = request.WeightKg,
            BodyFatPercent = request.BodyFatPercent,
            MuscleKg = request.MuscleKg,
            MeasurementNotes = request.Notes
        };

        await _measurements.AddAsync(measurement, cancellationToken);
        await _measurements.SaveChangesAsync(cancellationToken);

        return Result<BodyMeasurementDto>.Success(MapToDto(measurement));
    }

    internal static BodyMeasurementDto MapToDto(BodyMeasurement m) => new()
    {
        Id = m.Id,
        UserId = m.UserId,
        RecordedAt = m.RecordedAt,
        WeightKg = m.WeightKg,
        BodyFatPercent = m.BodyFatPercent,
        MuscleKg = m.MuscleKg,
        LeanBodyMassKg = m.CalculateLeanBodyMass(),
        FatMassKg = m.CalculateFatMass(),
        MeasurementNotes = m.MeasurementNotes
    };
}
