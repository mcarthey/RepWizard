using MediatR;
using RepWizard.Core.Common;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Ai.GetConversation;

/// <summary>
/// Retrieves a single AI conversation with all its messages.
/// </summary>
public class GetConversationQueryHandler : IRequestHandler<GetConversationQuery, Result<AiConversationDetailDto>>
{
    private readonly IAiConversationRepository _conversations;

    public GetConversationQueryHandler(IAiConversationRepository conversations)
    {
        _conversations = conversations;
    }

    public async Task<Result<AiConversationDetailDto>> Handle(
        GetConversationQuery request,
        CancellationToken cancellationToken)
    {
        var conversation = await _conversations.GetWithMessagesAsync(request.ConversationId, cancellationToken);
        if (conversation == null)
            return Result<AiConversationDetailDto>.Failure("Conversation not found.");

        var dto = new AiConversationDetailDto
        {
            Id = conversation.Id,
            UserId = conversation.UserId,
            StartedAt = conversation.StartedAt,
            Title = conversation.Title,
            ProgramGenerated = conversation.ProgramGenerated,
            Messages = conversation.Messages
                .OrderBy(m => m.Timestamp)
                .Select(m => new AiMessageDto
                {
                    Id = m.Id,
                    Role = m.Role.ToString(),
                    Content = m.Content,
                    Timestamp = m.Timestamp
                })
                .ToList()
        };

        return Result<AiConversationDetailDto>.Success(dto);
    }
}
