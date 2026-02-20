using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using RepWizard.Core.Interfaces;

namespace RepWizard.UI.ViewModels;

/// <summary>
/// ViewModel for the Today tab — the primary command center.
/// Shows current weekly progress, next scheduled session, and Start Workout CTA.
/// Design: hero circular progress, weekly status strip, metric chips, single primary CTA.
/// </summary>
public partial class TodayViewModel : BaseViewModel
{
    private readonly INavigationService _navigation;

    [ObservableProperty]
    private int _workoutsThisWeek;

    [ObservableProperty]
    private int _weeklyWorkoutGoal = 4;

    [ObservableProperty]
    private decimal _weeklyProgressPercent;

    [ObservableProperty]
    private int _currentStreakDays;

    [ObservableProperty]
    private int _minutesTrainedThisWeek;

    [ObservableProperty]
    private decimal _totalVolumeThisWeek;

    [ObservableProperty]
    private bool _hasActiveSession;

    [ObservableProperty]
    private string _nextWorkoutFocus = string.Empty;

    [ObservableProperty]
    private string _greetingText = string.Empty;

    public TodayViewModel(INavigationService navigation)
    {
        _navigation = navigation;
        Title = "Today";
        SetGreeting();
    }

    [RelayCommand]
    private async Task StartWorkoutAsync(CancellationToken ct)
    {
        await ExecuteSafeAsync(async () =>
        {
            if (HasActiveSession)
                await _navigation.NavigateToAsync("today/active-session");
            else
                await _navigation.NavigateToAsync("today/active-session");
        });
    }

    [RelayCommand]
    private async Task LoadAsync(CancellationToken ct)
    {
        await ExecuteSafeAsync(async () =>
        {
            // Phase 2: Load real data via MediatR queries
            // For Phase 1 skeleton, populate with placeholder values
            WorkoutsThisWeek = 0;
            WeeklyWorkoutGoal = 4;
            WeeklyProgressPercent = 0m;
            CurrentStreakDays = 0;
            MinutesTrainedThisWeek = 0;
            TotalVolumeThisWeek = 0;
            HasActiveSession = false;
            IsEmpty = true;
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
}
