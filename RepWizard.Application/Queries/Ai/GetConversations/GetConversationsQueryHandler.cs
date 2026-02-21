using MediatR;
using RepWizard.Core.Common;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Ai.GetConversations;

/// <summary>
/// Retrieves all AI conversations for a given user, ordered by most recent first.
/// </summary>
public class GetConversationsQueryHandler : IRequestHandler<GetConversationsQuery, Result<IReadOnlyList<AiConversationDto>>>
{
    private readonly IAiConversationRepository _conversations;

    public GetConversationsQueryHandler(IAiConversationRepository conversations)
    {
        _conversations = conversations;
    }

    public async Task<Result<IReadOnlyList<AiConversationDto>>> Handle(
        GetConversationsQuery request,
        CancellationToken cancellationToken)
    {
        var conversations = await _conversations.GetForUserAsync(request.UserId, cancellationToken);

        var dtos = conversations
            .OrderByDescending(c => c.StartedAt)
            .Select(c => new AiConversationDto
            {
                Id = c.Id,
                UserId = c.UserId,
                StartedAt = c.StartedAt,
                Title = c.Title,
                ProgramGenerated = c.ProgramGenerated,
                MessageCount = c.Messages.Count
            })
            .ToList() as IReadOnlyList<AiConversationDto>;

        return Result<IReadOnlyList<AiConversationDto>>.Success(dtos);
    }
}
