using MediatR;
using RepWizard.Core.Common;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Ai.GetGoalAnalysis;

public record GetGoalAnalysisQuery(Guid UserId) : IRequest<Result<GoalAnalysisDto>>;
