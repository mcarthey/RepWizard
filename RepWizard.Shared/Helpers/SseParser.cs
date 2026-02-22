namespace RepWizard.Shared.Helpers;

/// <summary>
/// Shared SSE (Server-Sent Events) line parsing utilities.
/// Used by both Infrastructure (AnthropicChatService) and UI (CoachViewModel)
/// to avoid duplicating the "data: " prefix parsing logic.
/// </summary>
public static class SseParser
{
    private const string DataPrefix = "data: ";
    private const string DoneMarker = "[DONE]";

    /// <summary>
    /// Tries to extract the data payload from an SSE line.
    /// Returns false for empty lines, non-data lines, and the [DONE] marker.
    /// </summary>
    public static bool TryParseDataLine(string? line, out string data)
    {
        data = string.Empty;

        if (string.IsNullOrEmpty(line))
            return false;

        if (!line.StartsWith(DataPrefix))
            return false;

        var payload = line[DataPrefix.Length..];

        if (payload == DoneMarker)
            return false;

        data = payload;
        return true;
    }
}
