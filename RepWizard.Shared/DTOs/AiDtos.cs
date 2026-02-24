namespace RepWizard.Shared.DTOs;

public class AiConversationDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public DateTime StartedAt { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool ProgramGenerated { get; set; }
    public int MessageCount { get; set; }
}

public class AiConversationDetailDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public DateTime StartedAt { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool ProgramGenerated { get; set; }
    public IList<AiMessageDto> Messages { get; set; } = new List<AiMessageDto>();
}

public class AiMessageDto
{
    public Guid Id { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

public class SendChatRequest
{
    public Guid? ConversationId { get; set; }
    public Guid UserId { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class GenerateProgramRequest
{
    public Guid UserId { get; set; }
    public Guid? ConversationId { get; set; }
    public string? GoalOverride { get; set; }
    public int? DaysPerWeek { get; set; }
    public int? DurationWeeks { get; set; }
    public int? SessionLengthMinutes { get; set; }
    public string? SplitType { get; set; }
}
