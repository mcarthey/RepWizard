using MediatR;
using RepWizard.Application.Services;
using RepWizard.Core.Common;
using RepWizard.Core.Interfaces.Services;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Ai.GetPlanInsight;

public class GetPlanInsightQueryHandler
    : IRequestHandler<GetPlanInsightQuery, Result<PlanInsightDto>>
{
    private readonly AiContextBuilder _contextBuilder;
    private readonly IAiChatService _aiChatService;

    public GetPlanInsightQueryHandler(
        AiContextBuilder contextBuilder,
        IAiChatService aiChatService)
    {
        _contextBuilder = contextBuilder;
        _aiChatService = aiChatService;
    }

    public async Task<Result<PlanInsightDto>> Handle(
        GetPlanInsightQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var context = await _contextBuilder.BuildContextAsync(request.UserId, cancellationToken);

            var systemPrompt =
                "You are a fitness advisor. Based on the user's training data, provide ONE concise, " +
                "actionable insight (1-2 sentences). Focus on what they should do next or adjust. " +
                "Be specific and practical, not generic. If there's not enough data, say so briefly.";

            var messages = new List<AiChatMessage>
            {
                new("user", $"Based on my training data, give me one actionable insight.\n\n<context>\n{context}\n</context>")
            };

            var response = await _aiChatService.ChatAsync(
                systemPrompt, messages, cancellationToken);

            if (string.IsNullOrWhiteSpace(response))
                return Result<PlanInsightDto>.Success(new PlanInsightDto { HasInsight = false });

            return Result<PlanInsightDto>.Success(new PlanInsightDto
            {
                InsightText = response.Trim(),
                HasInsight = true
            });
        }
        catch (Exception)
        {
            // AI failures are non-critical — return empty insight
            return Result<PlanInsightDto>.Success(new PlanInsightDto { HasInsight = false });
        }
    }
}
