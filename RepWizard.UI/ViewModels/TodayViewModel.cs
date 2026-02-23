using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MediatR;
using RepWizard.Application.Commands.Workouts.StartWorkoutSession;
using RepWizard.Application.Queries.Programs.GetTodayScheduledWorkout;
using RepWizard.Application.Queries.Workouts.GetActiveSession;
using RepWizard.Application.Queries.Workouts.GetSessionHistory;
using RepWizard.Core.Interfaces;
using RepWizard.Shared.DTOs;

namespace RepWizard.UI.ViewModels;

/// <summary>
/// ViewModel for the Today tab — the primary command center.
/// Shows current weekly progress, next scheduled session, and Start Workout CTA.
/// </summary>
public partial class TodayViewModel : BaseViewModel
{
    private readonly INavigationService _navigation;
    private readonly IMediator _mediator;
    private Guid _activeSessionId;

    [ObservableProperty] private int _workoutsThisWeek;
    [ObservableProperty] private int _weeklyWorkoutGoal = 4;
    [ObservableProperty] private decimal _weeklyProgressPercent;
    [ObservableProperty] private int _currentStreakDays;
    [ObservableProperty] private int _minutesTrainedThisWeek;
    [ObservableProperty] private decimal _totalVolumeThisWeek;
    [ObservableProperty] private bool _hasActiveSession;
    [ObservableProperty] private string _nextWorkoutFocus = string.Empty;
    [ObservableProperty] private string _greetingText = string.Empty;
    [ObservableProperty] private bool _hasScheduledWorkout;
    [ObservableProperty] private bool _isRestDay;
    [ObservableProperty] private string _scheduledProgramName = string.Empty;
    [ObservableProperty] private string _scheduledWeekInfo = string.Empty;

    public TodayViewModel(INavigationService navigation, IMediator mediator)
    {
        _navigation = navigation;
        _mediator = mediator;
        Title = "Today";
        SetGreeting();
    }

    [RelayCommand]
    private async Task StartWorkoutAsync(CancellationToken ct)
    {
        await ExecuteSafeAsync(async () =>
        {
            if (HasActiveSession && _activeSessionId != Guid.Empty)
            {
                await _navigation.NavigateToAsync(
                    $"active-session?sessionId={_activeSessionId}&userId={ActiveSessionViewModel.DefaultUserId}");
                return;
            }

            var result = await _mediator.Send(
                new StartWorkoutSessionCommand(ActiveSessionViewModel.DefaultUserId, null, null), ct);

            if (result.IsSuccess)
            {
                HasActiveSession = true;
                _activeSessionId = result.Value!.Id;
                await _navigation.NavigateToAsync(
                    $"active-session?sessionId={result.Value.Id}&userId={ActiveSessionViewModel.DefaultUserId}");
            }
            else
            {
                SetError(result.Error ?? "Failed to start session.");
            }
        });
    }

    [RelayCommand]
    private async Task LoadAsync(CancellationToken ct)
    {
        await ExecuteSafeAsync(async () =>
        {
            SetGreeting();

            // Check for active session
            var activeResult = await _mediator.Send(
                new GetActiveSessionQuery(ActiveSessionViewModel.DefaultUserId), ct);
            if (activeResult.IsSuccess && activeResult.Value != null)
            {
                HasActiveSession = true;
                _activeSessionId = activeResult.Value.Id;
            }
            else
            {
                HasActiveSession = false;
                _activeSessionId = Guid.Empty;
            }

            // Get recent session history for stats
            var historyResult = await _mediator.Send(
                new GetSessionHistoryQuery(ActiveSessionViewModel.DefaultUserId, 1, 100), ct);

            if (historyResult.IsSuccess)
            {
                var allSessions = historyResult.Value!.Items;
                var thisWeek = GetThisWeekSessions(allSessions);

                WorkoutsThisWeek = thisWeek.Count;
                WeeklyProgressPercent = WeeklyWorkoutGoal > 0
                    ? Math.Min(100, (decimal)WorkoutsThisWeek / WeeklyWorkoutGoal * 100)
                    : 0;
                MinutesTrainedThisWeek = thisWeek.Sum(s => s.DurationMinutes);
                TotalVolumeThisWeek = thisWeek.Sum(s => s.TotalVolume);
                CurrentStreakDays = CalculateStreak(allSessions);
                IsEmpty = WorkoutsThisWeek == 0 && !HasActiveSession;
            }

            // Load today's scheduled workout from active program
            var scheduledResult = await _mediator.Send(
                new GetTodayScheduledWorkoutQuery(ActiveSessionViewModel.DefaultUserId), ct);
            if (scheduledResult.IsSuccess && scheduledResult.Value != null)
            {
                var scheduled = scheduledResult.Value;
                HasScheduledWorkout = true;
                IsRestDay = scheduled.IsRestDay;
                ScheduledProgramName = scheduled.ProgramName;
                ScheduledWeekInfo = scheduled.IsDeloadWeek
                    ? $"Week {scheduled.CurrentWeekNumber}/{scheduled.TotalWeeks} (Deload)"
                    : $"Week {scheduled.CurrentWeekNumber}/{scheduled.TotalWeeks}";
                NextWorkoutFocus = scheduled.IsRestDay
                    ? "Rest Day"
                    : scheduled.Focus ?? scheduled.WorkoutTemplateName ?? string.Empty;
            }
            else
            {
                HasScheduledWorkout = false;
                IsRestDay = false;
                NextWorkoutFocus = string.Empty;
            }
        });
    }

    private void SetGreeting()
    {
        var hour = DateTime.Now.Hour;
        GreetingText = hour switch
        {
            < 12 => "Good morning",
            < 17 => "Good afternoon",
            _ => "Good evening"
        };
    }

    private static List<WorkoutHistoryDto> GetThisWeekSessions(IReadOnlyList<WorkoutHistoryDto> sessions)
    {
        var today = DateTime.UtcNow.Date;
        var daysSinceMonday = ((int)today.DayOfWeek + 6) % 7;
        var weekStart = today.AddDays(-daysSinceMonday);
        return sessions.Where(s => s.StartedAt.Date >= weekStart).ToList();
    }

    private static int CalculateStreak(IReadOnlyList<WorkoutHistoryDto> sessions)
    {
        var dates = sessions
            .Select(s => s.StartedAt.Date)
            .Distinct()
            .OrderByDescending(d => d)
            .ToList();

        if (dates.Count == 0) return 0;

        var streak = 0;
        var expected = DateTime.UtcNow.Date;

        // If no workout today, start checking from yesterday
        if (!dates.Contains(expected))
            expected = expected.AddDays(-1);

        foreach (var date in dates)
        {
            if (date == expected)
            {
                streak++;
                expected = expected.AddDays(-1);
            }
            else if (date < expected)
            {
                break;
            }
        }

        return streak;
    }
}
