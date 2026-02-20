using MediatR;
using RepWizard.Application.Commands.Measurements.LogBodyMeasurement;
using RepWizard.Core.Common;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Measurements.GetMeasurementHistory;

public class GetMeasurementHistoryQueryHandler
    : IRequestHandler<GetMeasurementHistoryQuery, Result<IReadOnlyList<BodyMeasurementDto>>>
{
    private readonly IBodyMeasurementRepository _measurements;

    public GetMeasurementHistoryQueryHandler(IBodyMeasurementRepository measurements)
    {
        _measurements = measurements;
    }

    public async Task<Result<IReadOnlyList<BodyMeasurementDto>>> Handle(
        GetMeasurementHistoryQuery request,
        CancellationToken cancellationToken)
    {
        var measurements = await _measurements.GetForUserAsync(
            request.UserId, request.Limit, cancellationToken);

        var dtos = measurements
            .Select(LogBodyMeasurementCommandHandler.MapToDto)
            .ToList();

        return Result<IReadOnlyList<BodyMeasurementDto>>.Success(dtos);
    }
}
