using MediatR;
using RepWizard.Core.Common;
using RepWizard.Core.Entities;
using RepWizard.Core.Enums;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Commands.Ai.SaveAiMessage;

/// <summary>
/// Saves an AI message to a conversation. If ConversationId is empty (Guid.Empty),
/// a new conversation is created automatically.
/// </summary>
public class SaveAiMessageCommandHandler : IRequestHandler<SaveAiMessageCommand, Result<AiMessageDto>>
{
    private readonly IAiConversationRepository _conversations;

    public SaveAiMessageCommandHandler(IAiConversationRepository conversations)
    {
        _conversations = conversations;
    }

    public async Task<Result<AiMessageDto>> Handle(
        SaveAiMessageCommand request,
        CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<MessageRole>(request.Role, ignoreCase: true, out var role))
            return Result<AiMessageDto>.Failure($"Invalid message role: '{request.Role}'. Must be User, Assistant, or System.");

        AiConversation conversation;

        if (request.ConversationId == Guid.Empty)
        {
            // Create a new conversation.
            conversation = new AiConversation
            {
                Title = "New Conversation",
                StartedAt = DateTime.UtcNow
            };
            await _conversations.AddAsync(conversation, cancellationToken);
        }
        else
        {
            var existing = await _conversations.GetWithMessagesAsync(request.ConversationId, cancellationToken);
            if (existing == null)
                return Result<AiMessageDto>.Failure("Conversation not found.");

            conversation = existing;
        }

        var message = new AiMessage
        {
            ConversationId = conversation.Id,
            Role = role,
            Content = request.Content,
            Timestamp = DateTime.UtcNow,
            TokensUsed = request.TokensUsed
        };

        conversation.Messages.Add(message);
        await _conversations.SaveChangesAsync(cancellationToken);

        return Result<AiMessageDto>.Success(new AiMessageDto
        {
            Id = message.Id,
            Role = message.Role.ToString(),
            Content = message.Content,
            Timestamp = message.Timestamp
        });
    }
}
