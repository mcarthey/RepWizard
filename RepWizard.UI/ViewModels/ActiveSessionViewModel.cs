using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MediatR;
using RepWizard.Application.Commands.Workouts.CompleteWorkoutSession;
using RepWizard.Application.Commands.Workouts.LogSet;
using RepWizard.Application.Queries.Exercises.GetExercises;
using RepWizard.Application.Queries.Workouts.GetLastSessionDefaults;
using RepWizard.Core.Interfaces;
using RepWizard.Shared.DTOs;

namespace RepWizard.UI.ViewModels;

/// <summary>
/// Display model for a single logged set shown in the session's set list.
/// </summary>
public record LoggedSetDisplayItem(
    string ExerciseName,
    int SetNumber,
    string SetType,
    decimal? WeightKg,
    int Reps,
    decimal? RPE,
    int? RIR)
{
    public string WeightDisplay => WeightKg.HasValue ? $"{WeightKg:0.#} kg" : "BW";
    public string RepsDisplay => $"{Reps} reps";
    public string IntensityDisplay =>
        RPE.HasValue ? $"RPE {RPE:0.#}" :
        RIR.HasValue ? $"RIR {RIR}" : "";
}

/// <summary>
/// ViewModel for the Active Session screen — the primary interaction surface.
/// Offline-first: all set logging goes through LogSetCommand to SQLite only.
/// Progressive overload defaults are loaded from the last session.
/// </summary>
public partial class ActiveSessionViewModel : BaseViewModel, IQueryAttributable
{
    private readonly IMediator _mediator;
    private readonly INavigationService _navigation;
    private CancellationTokenSource _restTimerCts = new();
    private CancellationTokenSource _elapsedTimerCts = new();
    private IReadOnlyDictionary<Guid, LastSetDefault> _lastSessionDefaults =
        new Dictionary<Guid, LastSetDefault>();

    internal static readonly Guid DefaultUserId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private Guid _userId = DefaultUserId;

    [ObservableProperty] private Guid _sessionId;
    [ObservableProperty] private string _sessionNotes = string.Empty;
    [ObservableProperty] private DateTime _sessionStartTime;
    [ObservableProperty] private string _elapsedTime = "0:00";
    [ObservableProperty] private bool _isRestTimerActive;
    [ObservableProperty] private int _restTimerSeconds;
    [ObservableProperty] private int _restTimerTotalSeconds = 120;

    // Available exercises for the picker
    [ObservableProperty] private IReadOnlyList<ExerciseDto> _availableExercises = new List<ExerciseDto>();

    // Flat list of logged sets for display
    [ObservableProperty] private ObservableCollection<LoggedSetDisplayItem> _loggedSets = new();

    // Form state
    [ObservableProperty] private ExerciseDto? _selectedExercise;
    [ObservableProperty] private string _weightKgText = string.Empty;
    [ObservableProperty] private string _repsText = "8";
    [ObservableProperty] private string _rpeText = string.Empty;
    [ObservableProperty] private string _rirText = string.Empty;
    [ObservableProperty] private string _selectedSetType = "Working";
    [ObservableProperty] private int _currentSetNumber = 1;

    public IReadOnlyList<string> SetTypeOptions { get; } =
        ["Warmup", "Working", "Dropset", "FailureSet", "ForceRep", "NegativeOnly", "IsometricHold"];

    public string RestTimerDisplay =>
        $"{RestTimerSeconds / 60}:{RestTimerSeconds % 60:D2}";

    public ActiveSessionViewModel(IMediator mediator, INavigationService navigation)
    {
        _mediator = mediator;
        _navigation = navigation;
        Title = "Active Session";
    }

    public void ApplyQueryAttributes(IDictionary<string, object> query)
    {
        if (query.TryGetValue("sessionId", out var sid) && Guid.TryParse(sid?.ToString(), out var sessionId))
            SessionId = sessionId;
        if (query.TryGetValue("userId", out var uid) && Guid.TryParse(uid?.ToString(), out var userId))
            _userId = userId;
    }

    partial void OnRestTimerSecondsChanged(int value)
    {
        OnPropertyChanged(nameof(RestTimerDisplay));
    }

    [RelayCommand]
    public async Task InitializeAsync(CancellationToken ct = default)
    {
        await ExecuteSafeAsync(async () =>
        {
            SessionStartTime = DateTime.UtcNow;
            StartElapsedTimer();

            var exercisesResult = await _mediator.Send(
                new GetExercisesQuery(null, null, null, 1, 200), ct);
            if (exercisesResult.IsSuccess)
                AvailableExercises = exercisesResult.Value!.Items;

            var defaultsResult = await _mediator.Send(
                new GetLastSessionDefaultsQuery(_userId), ct);
            if (defaultsResult.IsSuccess)
                _lastSessionDefaults = defaultsResult.Value!;
        });
    }

    public LastSetDefault? GetDefaultsForExercise(Guid exerciseId)
        => _lastSessionDefaults.TryGetValue(exerciseId, out var d) ? d : null;

    partial void OnSelectedExerciseChanged(ExerciseDto? value)
    {
        if (value == null) return;
        var defaults = GetDefaultsForExercise(value.Id);
        if (defaults != null)
        {
            WeightKgText = defaults.WeightKg?.ToString("0.#") ?? string.Empty;
            RepsText = defaults.Reps.ToString();
            RirText = defaults.RepsInReserve?.ToString() ?? string.Empty;
            RpeText = defaults.RPE?.ToString("0.#") ?? string.Empty;
        }
        else
        {
            WeightKgText = string.Empty;
            RepsText = "8";
            RirText = string.Empty;
            RpeText = string.Empty;
        }
        CurrentSetNumber = LoggedSets.Count(s => s.ExerciseName == value.Name) + 1;
        SelectedSetType = CurrentSetNumber == 1 ? "Warmup" : "Working";
    }

    [RelayCommand]
    private async Task LogSetFromFormAsync(CancellationToken ct)
    {
        if (SelectedExercise == null) { SetError("Select an exercise first."); return; }
        if (!int.TryParse(RepsText, out var reps) || reps <= 0) { SetError("Enter valid reps."); return; }

        var weightKg = decimal.TryParse(WeightKgText, out var w) ? w : (decimal?)null;
        var rpe = decimal.TryParse(RpeText, out var rp) ? rp : (decimal?)null;
        var rir = int.TryParse(RirText, out var ri) ? ri : (int?)null;

        await ExecuteSafeAsync(async () =>
        {
            var result = await _mediator.Send(new LogSetCommand(
                SessionId, SelectedExercise.Id, CurrentSetNumber,
                weightKg, reps, rir, rpe, SelectedSetType, null), ct);

            if (result.IsFailure)
            {
                SetError(result.Error ?? "Failed to log set.");
                return;
            }

            LoggedSets.Add(new LoggedSetDisplayItem(
                SelectedExercise.Name, CurrentSetNumber, SelectedSetType,
                weightKg, reps, rpe, rir));

            CurrentSetNumber++;
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
            StopElapsedTimer();
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

    private void StartElapsedTimer()
    {
        _elapsedTimerCts.Cancel();
        _elapsedTimerCts = new CancellationTokenSource();
        var token = _elapsedTimerCts.Token;

        Task.Run(async () =>
        {
            while (!token.IsCancellationRequested)
            {
                var elapsed = DateTime.UtcNow - SessionStartTime;
                ElapsedTime = $"{(int)elapsed.TotalMinutes}:{elapsed.Seconds:D2}";
                await Task.Delay(1000, token).ConfigureAwait(false);
            }
        }, token);
    }

    private void StopElapsedTimer() => _elapsedTimerCts.Cancel();
}
