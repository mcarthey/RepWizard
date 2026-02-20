using MediatR;
using RepWizard.Core.Common;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Measurements.GetMeasurementHistory;

public record GetMeasurementHistoryQuery(
    Guid UserId,
    int? Limit = null
) : IRequest<Result<IReadOnlyList<BodyMeasurementDto>>>;
