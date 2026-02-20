using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using RepWizard.Core.Interfaces;

namespace RepWizard.UI.ViewModels;

/// <summary>
/// ViewModel for the Active Session screen — the primary interaction surface.
/// Critical requirements:
/// - Zero API calls during an active session (offline-first)
/// - All writes go to local SQLite immediately on set completion
/// - Large touch targets, one-handed use, minimal scrolling
/// - Rest timer fires after each set completion
/// - Progressive overload defaults from last session
/// </summary>
public partial class ActiveSessionViewModel : BaseViewModel
{
    private readonly INavigationService _navigation;
    private CancellationTokenSource _restTimerCts = new();

    [ObservableProperty]
    private Guid _sessionId;

    [ObservableProperty]
    private string _sessionNotes = string.Empty;

    [ObservableProperty]
    private DateTime _sessionStartTime;

    [ObservableProperty]
    private string _elapsedTime = "0:00";

    [ObservableProperty]
    private bool _isRestTimerActive;

    [ObservableProperty]
    private int _restTimerSeconds;

    [ObservableProperty]
    private int _restTimerTotalSeconds = 120;

    public ActiveSessionViewModel(INavigationService navigation)
    {
        _navigation = navigation;
        Title = "Active Session";
    }

    [RelayCommand]
    private async Task LogSetAsync(CancellationToken ct)
    {
        await ExecuteSafeAsync(async () =>
        {
            // Phase 2: Implement set logging via MediatR command
            // Writes go to SQLite immediately — no API calls during session
            StartRestTimer();
        });
    }

    [RelayCommand]
    private async Task CompleteSessionAsync(CancellationToken ct)
    {
        await ExecuteSafeAsync(async () =>
        {
            // Phase 2: Complete session via MediatR command, then trigger sync
            await _navigation.NavigateBackAsync();
        });
    }

    private void StartRestTimer()
    {
        _restTimerCts.Cancel();
        _restTimerCts = new CancellationTokenSource();
        IsRestTimerActive = true;
        RestTimerSeconds = RestTimerTotalSeconds;

        Task.Run(async () =>
        {
            while (RestTimerSeconds > 0 && !_restTimerCts.Token.IsCancellationRequested)
            {
                await Task.Delay(1000, _restTimerCts.Token);
                RestTimerSeconds--;
            }
            IsRestTimerActive = false;
        }, _restTimerCts.Token);
    }

    [RelayCommand]
    private void SkipRestTimer()
    {
        _restTimerCts.Cancel();
        IsRestTimerActive = false;
    }
}
