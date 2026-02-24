using MediatR;
using RepWizard.Core.Common;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Ai.GetPlanInsight;

public record GetPlanInsightQuery(Guid UserId) : IRequest<Result<PlanInsightDto>>;
