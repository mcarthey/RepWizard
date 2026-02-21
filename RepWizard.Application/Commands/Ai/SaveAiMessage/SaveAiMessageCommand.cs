using MediatR;
using RepWizard.Core.Common;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Commands.Ai.SaveAiMessage;

public record SaveAiMessageCommand(
    Guid ConversationId,
    string Role,
    string Content,
    int? TokensUsed
) : IRequest<Result<AiMessageDto>>;
