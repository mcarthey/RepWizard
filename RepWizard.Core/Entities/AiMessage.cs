using RepWizard.Core.Enums;

namespace RepWizard.Core.Entities;

/// <summary>
/// A single message within an AI conversation (user, assistant, or system).
/// </summary>
public class AiMessage : BaseEntity
{
    public Guid ConversationId { get; set; }
    public MessageRole Role { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public int? TokensUsed { get; set; }

    // Navigation properties
    public AiConversation? Conversation { get; set; }

    /// <summary>
    /// Returns a truncated preview of the content for display in conversation lists.
    /// </summary>
    public string GetContentPreview(int maxLength = 100)
    {
        if (Content.Length <= maxLength) return Content;
        return Content[..maxLength] + "...";
    }
}
