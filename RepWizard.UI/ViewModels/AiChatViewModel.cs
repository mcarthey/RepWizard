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
/// ViewModel for the AI Chat page (formerly Coach tab).
/// Calls the SSE endpoint at /api/v1/ai/chat and accumulates streamed tokens into
/// a ChatMessageItem in real time.
/// </summary>
public partial class AiChatViewModel : BaseViewModel, IQueryAttributable
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

    [ObservableProperty]
    private Guid? _conversationId;

    [ObservableProperty]
    private string _conversationTitle = "New Conversation";

    private CancellationTokenSource _streamCts = new();

    public AiChatViewModel(INavigationService navigation, IHttpClientFactory httpClientFactory)
    {
        _navigation = navigation;
        _httpClientFactory = httpClientFactory;
        Title = "AI Coach";
    }

    public void ApplyQueryAttributes(IDictionary<string, object> query)
    {
        if (query.TryGetValue("source", out var source))
        {
            // Context pre-loading hint from hub or builder
            var sourceStr = source?.ToString();
            if (sourceStr == "hub")
                ConversationTitle = "Training Plan Chat";
            else if (sourceStr == "builder")
                ConversationTitle = "Program Builder Chat";
        }
    }

    [RelayCommand(CanExecute = nameof(CanSendMessage))]
    private async Task SendMessageAsync(CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(UserInput)) return;

        var userMessage = UserInput.Trim();
        UserInput = string.Empty;

        Messages.Add(new ChatMessageItem(userMessage, isUser: true));

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

                            if (root.TryGetProperty("content", out var contentProp))
                            {
                                var chunk = contentProp.GetString();
                                if (!string.IsNullOrEmpty(chunk))
                                {
                                    MainThread.BeginInvokeOnMainThread(() =>
                                        assistantMessage.AppendContent(chunk));
                                }
                            }

                            if (root.TryGetProperty("conversationId", out var convIdProp))
                            {
                                var convIdStr = convIdProp.GetString();
                                if (Guid.TryParse(convIdStr, out var convId))
                                    ConversationId = convId;
                            }

                            if (root.TryGetProperty("title", out var titleProp))
                            {
                                var title = titleProp.GetString();
                                if (!string.IsNullOrEmpty(title))
                                    ConversationTitle = title;
                            }
                        }
                        catch (JsonException ex)
                        {
                            System.Diagnostics.Debug.WriteLine($"AiChatViewModel: Malformed SSE data, skipping: {ex.Message}");
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

    partial void OnIsStreamingChanged(bool value)
    {
        SendMessageCommand.NotifyCanExecuteChanged();
    }
}
