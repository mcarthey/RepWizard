using MediatR;
using RepWizard.Core.Common;
using RepWizard.Shared.DTOs;

namespace RepWizard.Application.Queries.Ai.GetConversations;

public record GetConversationsQuery(Guid UserId) : IRequest<Result<IReadOnlyList<AiConversationDto>>>;
