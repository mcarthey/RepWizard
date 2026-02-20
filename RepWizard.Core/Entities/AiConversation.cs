namespace RepWizard.Core.Entities;

/// <summary>
/// A conversation thread with the AI Coach, containing message history and context.
/// </summary>
public class AiConversation : BaseEntity
{
    public Guid UserId { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public string? Context { get; set; }
    public bool ProgramGenerated { get; set; } = false;
    public string Title { get; set; } = "New Conversation";

    // Navigation properties
    public User? User { get; set; }
    public ICollection<AiMessage> Messages { get; set; } = new List<AiMessage>();

    /// <summary>
    /// Returns the total token count used across all messages in this conversation.
    /// </summary>
    public int GetTotalTokensUsed()
        => Messages.Sum(m => m.TokensUsed ?? 0);

    /// <summary>
    /// Returns the last user message in the conversation.
    /// </summary>
    public AiMessage? GetLastUserMessage()
        => Messages
            .Where(m => m.Role == Enums.MessageRole.User)
            .OrderByDescending(m => m.Timestamp)
            .FirstOrDefault();

    /// <summary>
    /// Returns the last assistant message in the conversation.
    /// </summary>
    public AiMessage? GetLastAssistantMessage()
        => Messages
            .Where(m => m.Role == Enums.MessageRole.Assistant)
            .OrderByDescending(m => m.Timestamp)
            .FirstOrDefault();
}
