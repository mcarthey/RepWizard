using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MediatR;
using RepWizard.Application.Commands.Workouts.CompleteWorkoutSession;
using RepWizard.Application.Commands.Workouts.LogSet;
using RepWizard.Application.Queries.Workouts.GetLastSessionDefaults;
using RepWizard.Core.Interfaces;
using RepWizard.Shared.DTOs;

namespace RepWizard.UI.ViewModels;

/// <summary>
/// ViewModel for the Active Session screen — the primary interaction surface.
/// Offline-first: all set logging goes through LogSetCommand → SQLite only, zero API calls.
/// Progressive overload defaults are loaded from the last session via GetLastSessionDefaultsQuery.
/// Sync is triggered on session completion via CompleteWorkoutSessionCommand.
/// </summary>
public partial class ActiveSessionViewModel : BaseViewModel
{
    private readonly IMediator _mediator;
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

    [ObservableProperty]
    private IReadOnlyList<SessionExerciseDto> _exercises = new List<SessionExerciseDto>();

    // Keyed by ExerciseId — pre-filled progressive overload defaults
    private IReadOnlyDictionary<Guid, LastSetDefault> _lastSessionDefaults =
        new Dictionary<Guid, LastSetDefault>();

    public ActiveSessionViewModel(IMediator mediator, INavigationService navigation)
    {
        _mediator = mediator;
        _navigation = navigation;
        Title = "Active Session";
    }

    /// <summary>
    /// Called when the session screen is navigated to.
    /// Loads progressive overload defaults from the last session for this user.
    /// </summary>
    [RelayCommand]
    public async Task LoadSessionAsync(Guid userId, CancellationToken ct = default)
    {
        await ExecuteSafeAsync(async () =>
        {
            var defaultsResult = await _mediator.Send(new GetLastSessionDefaultsQuery(userId), ct);
            if (defaultsResult.IsSuccess)
                _lastSessionDefaults = defaultsResult.Value!;
        });
    }

    /// <summary>
    /// Returns the progressive overload default for an exercise, or null if no prior session data exists.
    /// </summary>
    public LastSetDefault? GetDefaultsForExercise(Guid exerciseId)
        => _lastSessionDefaults.TryGetValue(exerciseId, out var d) ? d : null;

    [RelayCommand]
    private async Task LogSetAsync(LogSetRequest request, CancellationToken ct)
    {
        await ExecuteSafeAsync(async () =>
        {
            var result = await _mediator.Send(new LogSetCommand(
                SessionId,
                request.ExerciseId,
                request.SetNumber,
                request.WeightKg,
                request.Reps,
                request.RepsInReserve,
                request.RPE,
                request.SetType,
                request.DurationSeconds), ct);

            if (result.IsFailure)
            {
                SetError(result.Error ?? "Failed to log set.");
                return;
            }

            StartRestTimer();
        });
    }

    [RelayCommand]
    private async Task CompleteSessionAsync(CancellationToken ct)
    {
        await ExecuteSafeAsync(async () =>
        {
            var notes = string.IsNullOrWhiteSpace(SessionNotes) ? null : SessionNotes;
            var result = await _mediator.Send(
                new CompleteWorkoutSessionCommand(SessionId, notes), ct);

            if (result.IsFailure)
            {
                SetError(result.Error ?? "Failed to complete session.");
                return;
            }

            _restTimerCts.Cancel();
            await _navigation.NavigateBackAsync();
        });
    }

    private void StartRestTimer()
    {
        _restTimerCts.Cancel();
        _restTimerCts = new CancellationTokenSource();
        IsRestTimerActive = true;
        RestTimerSeconds = RestTimerTotalSeconds;
        var token = _restTimerCts.Token;

        Task.Run(async () =>
        {
            while (RestTimerSeconds > 0 && !token.IsCancellationRequested)
            {
                await Task.Delay(1000, token).ConfigureAwait(false);
                if (!token.IsCancellationRequested)
                    RestTimerSeconds--;
            }
            IsRestTimerActive = false;
        }, token);
    }

    [RelayCommand]
    private void SkipRestTimer()
    {
        _restTimerCts.Cancel();
        IsRestTimerActive = false;
    }
}
