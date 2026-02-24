using MediatR;
using RepWizard.Application.Services;
using RepWizard.Core.Common;
using RepWizard.Core.Interfaces.Services;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Ai.GetGoalAnalysis;

public class GetGoalAnalysisQueryHandler
    : IRequestHandler<GetGoalAnalysisQuery, Result<GoalAnalysisDto>>
{
    private readonly AiContextBuilder _contextBuilder;
    private readonly IAiChatService _aiChatService;

    public GetGoalAnalysisQueryHandler(
        AiContextBuilder contextBuilder,
        IAiChatService aiChatService)
    {
        _contextBuilder = contextBuilder;
        _aiChatService = aiChatService;
    }

    public async Task<Result<GoalAnalysisDto>> Handle(
        GetGoalAnalysisQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var context = await _contextBuilder.BuildContextAsync(request.UserId, cancellationToken);

            var systemPrompt =
                "You are a fitness advisor. Analyze the user's goals in the context of their " +
                "training history and profile. Provide a brief analysis (2-3 sentences) of whether " +
                "their goals are realistic, what they should prioritize, and any adjustments to consider. " +
                "If no goals are set, suggest setting specific goals.";

            var messages = new List<AiChatMessage>
            {
                new("user", $"Analyze my training goals.\n\n<context>\n{context}\n</context>")
            };

            var response = await _aiChatService.ChatAsync(
                systemPrompt, messages, cancellationToken);

            if (string.IsNullOrWhiteSpace(response))
                return Result<GoalAnalysisDto>.Success(new GoalAnalysisDto { HasAnalysis = false });

            return Result<GoalAnalysisDto>.Success(new GoalAnalysisDto
            {
                AnalysisText = response.Trim(),
                HasAnalysis = true
            });
        }
        catch (Exception)
        {
            // AI failures are non-critical
            return Result<GoalAnalysisDto>.Success(new GoalAnalysisDto { HasAnalysis = false });
        }
    }
}
