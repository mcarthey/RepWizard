namespace RepWizard.Core.Interfaces.Services;

public record AiChatMessage(string Role, string Content);

public interface IAiChatService
{
    IAsyncEnumerable<string> StreamChatAsync(
        string systemPrompt,
        IReadOnlyList<AiChatMessage> messages,
        CancellationToken ct);

    Task<string> ChatAsync(
        string systemPrompt,
        IReadOnlyList<AiChatMessage> messages,
        CancellationToken ct);
}
