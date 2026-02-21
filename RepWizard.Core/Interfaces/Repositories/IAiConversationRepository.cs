using RepWizard.Core.Entities;

namespace RepWizard.Core.Interfaces.Repositories;

public interface IAiConversationRepository : IRepository<AiConversation>
{
    Task<AiConversation?> GetWithMessagesAsync(Guid conversationId, CancellationToken ct = default);
    Task<IReadOnlyList<AiConversation>> GetForUserAsync(Guid userId, CancellationToken ct = default);
}
