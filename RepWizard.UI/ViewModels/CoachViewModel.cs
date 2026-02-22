using System.Collections.ObjectModel;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using RepWizard.Core.Interfaces;
using RepWizard.Shared.DTOs;
using RepWizard.Shared.Helpers;

namespace RepWizard.UI.ViewModels;

/// <summary>
/// Display model for a single chat message shown in the conversation.
/// </summary>
public partial class ChatMessageItem : ObservableObject
{
    [ObservableProperty]
    private string _content;

    public bool IsUser { get; }
    public DateTime Timestamp { get; }

    /// <summary>
    /// Whether this message is currently being streamed (assistant only).
    /// </summary>
    [ObservableProperty]
    private bool _isStreaming;

    public ChatMessageItem(string content, bool isUser, DateTime? timestamp = null)
    {
        _content = content;
        IsUser = isUser;
        Timestamp = timestamp ?? DateTime.Now;
    }

    /// <summary>
    /// Append streamed content to an assistant message.
    /// </summary>
    public void AppendContent(string text)
    {
        Content += text;
    }
}

/// <summary>
/// ViewModel for the Coach tab -- AI chat interface with streaming response support.
/// Calls the SSE endpoint at /api/v1/ai/chat and accumulates streamed tokens into
/// a ChatMessageItem in real time.
/// </summary>
public partial class CoachViewModel : BaseViewModel
{
    private readonly INavigationService _navigation;
    private readonly IHttpClientFactory _httpClientFactory;
    private static readonly Guid DefaultUserId = ActiveSessionViewModel.DefaultUserId;

    [ObservableProperty]
    private string _userInput = string.Empty;

    [ObservableProperty]
    private ObservableCollection<ChatMessageItem> _messages = new();

    [ObservableProperty]
    private bool _isStreaming;

    /// <summary>
    /// Tracks the current conversation ID returned by the API after the first message.
    /// Subsequent messages in the same conversation include this ID so the server
    /// can append to the existing conversation thread.
    /// </summary>
    [ObservableProperty]
    private Guid? _conversationId;

    /// <summary>
    /// Display title for the current conversation.
    /// </summary>
    [ObservableProperty]
    private string _conversationTitle = "New Conversation";

    private CancellationTokenSource _streamCts = new();

    public CoachViewModel(INavigationService navigation, IHttpClientFactory httpClientFactory)
    {
        _navigation = navigation;
        _httpClientFactory = httpClientFactory;
        Title = "Coach";
    }

    [RelayCommand(CanExecute = nameof(CanSendMessage))]
    private async Task SendMessageAsync(CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(UserInput)) return;

        var userMessage = UserInput.Trim();
        UserInput = string.Empty;

        // Add user bubble
        Messages.Add(new ChatMessageItem(userMessage, isUser: true));

        // Prepare assistant bubble for streaming
        var assistantMessage = new ChatMessageItem(string.Empty, isUser: false)
        {
            IsStreaming = true
        };
        Messages.Add(assistantMessage);

        await ExecuteSafeAsync(async () =>
        {
            IsStreaming = true;
            _streamCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            var token = _streamCts.Token;

            try
            {
                var client = _httpClientFactory.CreateClient("RepWizardApi");

                var request = new SendChatRequest
                {
                    ConversationId = ConversationId,
                    UserId = DefaultUserId,
                    Message = userMessage
                };

                var httpRequest = new HttpRequestMessage(HttpMethod.Post, "api/v1/ai/chat")
                {
                    Content = new StringContent(
                        JsonSerializer.Serialize(request),
                        Encoding.UTF8,
                        "application/json")
                };
                httpRequest.Headers.Accept.Add(
                    new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("text/event-stream"));

                using var response = await client.SendAsync(
                    httpRequest,
                    HttpCompletionOption.ResponseHeadersRead,
                    token);

                response.EnsureSuccessStatusCode();

                using var stream = await response.Content.ReadAsStreamAsync(token);
                using var reader = new StreamReader(stream);

                while (!reader.EndOfStream && !token.IsCancellationRequested)
                {
                    var line = await reader.ReadLineAsync(token);

                    if (SseParser.TryParseDataLine(line, out var data))
                    {
                        try
                        {
                            using var doc = JsonDocument.Parse(data);
                            var root = doc.RootElement;

                            // Extract streamed content token
                            if (root.TryGetProperty("content", out var contentProp))
                            {
                                var chunk = contentProp.GetString();
                                if (!string.IsNullOrEmpty(chunk))
                                {
                                    // Update on main thread for UI binding
                                    MainThread.BeginInvokeOnMainThread(() =>
                                        assistantMessage.AppendContent(chunk));
                                }
                            }

                            // Extract conversationId if present (returned on first message)
                            if (root.TryGetProperty("conversationId", out var convIdProp))
                            {
                                var convIdStr = convIdProp.GetString();
                                if (Guid.TryParse(convIdStr, out var convId))
                                    ConversationId = convId;
                            }

                            // Extract title if present
                            if (root.TryGetProperty("title", out var titleProp))
                            {
                                var title = titleProp.GetString();
                                if (!string.IsNullOrEmpty(title))
                                    ConversationTitle = title;
                            }
                        }
                        catch (JsonException ex)
                        {
                            System.Diagnostics.Debug.WriteLine($"CoachViewModel: Malformed SSE data, skipping: {ex.Message}");
                        }
                    }
                }
            }
            finally
            {
                assistantMessage.IsStreaming = false;
            }
        }, "Failed to get AI response");

        IsStreaming = false;
        SendMessageCommand.NotifyCanExecuteChanged();
    }

    private bool CanSendMessage() => !IsLoading && !IsStreaming;

    [RelayCommand]
    private void CancelStream()
    {
        _streamCts.Cancel();
        IsStreaming = false;
        SendMessageCommand.NotifyCanExecuteChanged();
    }

    /// <summary>
    /// Start a new conversation -- clears messages and resets the conversation ID.
    /// </summary>
    [RelayCommand]
    private void NewConversation()
    {
        Messages.Clear();
        ConversationId = null;
        ConversationTitle = "New Conversation";
        UserInput = string.Empty;
        IsStreaming = false;
        ClearError();
    }

    [RelayCommand]
    private async Task NavigateToProgramsAsync(CancellationToken ct)
    {
        await _navigation.NavigateToAsync("coach/programs");
    }

    [RelayCommand]
    private async Task NavigateToLibraryAsync(CancellationToken ct)
    {
        await _navigation.NavigateToAsync("coach/library");
    }

    partial void OnIsStreamingChanged(bool value)
    {
        SendMessageCommand.NotifyCanExecuteChanged();
    }
}
