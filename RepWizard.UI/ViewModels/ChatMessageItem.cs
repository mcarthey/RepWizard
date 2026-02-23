using CommunityToolkit.Mvvm.ComponentModel;

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

    [ObservableProperty]
    private bool _isStreaming;

    public ChatMessageItem(string content, bool isUser, DateTime? timestamp = null)
    {
        _content = content;
        IsUser = isUser;
        Timestamp = timestamp ?? DateTime.Now;
    }

    public void AppendContent(string text)
    {
        Content += text;
    }
}
