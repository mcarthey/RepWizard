using MediatR;
using RepWizard.Core.Common;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Measurements.GetProgressChartData;

public record GetProgressChartDataQuery(
    Guid UserId,
    int WeeksBack = 12
) : IRequest<Result<ProgressChartDataDto>>;
