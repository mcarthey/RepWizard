using Microsoft.EntityFrameworkCore;
using RepWizard.Core.Entities;
using RepWizard.Core.Interfaces.Repositories;
using RepWizard.Infrastructure.Data;

namespace RepWizard.Infrastructure.Repositories;

public class AiConversationRepository : Repository<AiConversation>, IAiConversationRepository
{
    public AiConversationRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<AiConversation?> GetWithMessagesAsync(
        Guid conversationId, CancellationToken ct = default)
        => await _dbSet
            .Include(c => c.Messages.OrderBy(m => m.Timestamp))
            .FirstOrDefaultAsync(c => c.Id == conversationId, ct);

    public async Task<IReadOnlyList<AiConversation>> GetForUserAsync(
        Guid userId, CancellationToken ct = default)
        => await _dbSet
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.StartedAt)
            .ToListAsync(ct);
}
