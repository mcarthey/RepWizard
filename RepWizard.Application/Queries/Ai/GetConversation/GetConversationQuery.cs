using MediatR;
using RepWizard.Core.Common;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Ai.GetConversation;

public record GetConversationQuery(Guid ConversationId) : IRequest<Result<AiConversationDetailDto>>;
