using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using RepWizard.Core.Interfaces;

namespace RepWizard.UI.ViewModels;

/// <summary>
/// ViewModel for the Coach tab — AI chat interface with streaming response support.
/// Phase 4 will implement Claude API streaming via SSE.
/// </summary>
public partial class CoachViewModel : BaseViewModel
{
    private readonly INavigationService _navigation;

    [ObservableProperty]
    private string _userInput = string.Empty;

    [ObservableProperty]
    private IList<ChatMessageItem> _messages = new List<ChatMessageItem>();

    [ObservableProperty]
    private bool _isStreaming;

    private CancellationTokenSource _streamCts = new();

    public CoachViewModel(INavigationService navigation)
    {
        _navigation = navigation;
        Title = "Coach";
    }

    [RelayCommand(CanExecute = nameof(CanSendMessage))]
    private async Task SendMessageAsync(CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(UserInput)) return;

        var userMessage = UserInput;
        UserInput = string.Empty;

        Messages.Add(new ChatMessageItem(userMessage, IsUser: true));

        await ExecuteSafeAsync(async () =>
        {
            IsStreaming = true;
            _streamCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            // Phase 4: Call AI Coach streaming endpoint via HttpClient
            // Read SSE stream and update Messages in real time
        });

        IsStreaming = false;
    }

    private bool CanSendMessage() => !IsLoading && !IsStreaming;

    [RelayCommand]
    private void CancelStream()
    {
        _streamCts.Cancel();
        IsStreaming = false;
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
}

public record ChatMessageItem(string Content, bool IsUser, DateTime Timestamp = default)
{
    public DateTime Timestamp { get; init; } = Timestamp == default ? DateTime.Now : Timestamp;
}
