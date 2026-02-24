using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MediatR;
using RepWizard.Application.Queries.Programs.GetTrainingPrograms;
using RepWizard.Application.Queries.Users.GetUserProfile;
using RepWizard.Core.Interfaces;
using RepWizard.Shared.DTOs;

namespace RepWizard.UI.ViewModels;

/// <summary>
/// ViewModel for the Plan Hub — landing page of the Plan tab.
/// Shows active program, user goals, and navigation to builder/AI chat.
/// </summary>
public partial class PlanHubViewModel : BaseViewModel
{
    private readonly IMediator _mediator;
    private readonly INavigationService _navigation;
    private static readonly Guid DefaultUserId = ActiveSessionViewModel.DefaultUserId;

    // Active program
    [ObservableProperty] private string _activeProgramName = string.Empty;
    [ObservableProperty] private string _activeProgramProgress = string.Empty;
    [ObservableProperty] private double _programProgressPercent;
    [ObservableProperty] private bool _hasActiveProgram;
    [ObservableProperty] private Guid? _activeProgramId;

    // Goals strip
    [ObservableProperty] private string? _longTermGoalText;
    [ObservableProperty] private string? _shortTermFocusText;
    [ObservableProperty] private bool _hasGoals;

    public PlanHubViewModel(IMediator mediator, INavigationService navigation)
    {
        _mediator = mediator;
        _navigation = navigation;
        Title = "Your Training Plan";
    }

    [RelayCommand]
    public async Task LoadAsync(CancellationToken ct = default)
    {
        await ExecuteSafeAsync(async () =>
        {
            // Load user profile for goals
            var profileResult = await _mediator.Send(new GetUserProfileQuery(DefaultUserId), ct);
            if (profileResult.IsSuccess && profileResult.Value != null)
            {
                var user = profileResult.Value;
                LongTermGoalText = user.LongTermGoalText;
                ShortTermFocusText = user.ShortTermFocusText;
                HasGoals = !string.IsNullOrWhiteSpace(user.LongTermGoalText)
                        || !string.IsNullOrWhiteSpace(user.ShortTermFocusText);
            }

            // Load active program
            var programsResult = await _mediator.Send(new GetTrainingProgramsQuery(DefaultUserId), ct);
            if (programsResult.IsSuccess && programsResult.Value != null)
            {
                var active = programsResult.Value.FirstOrDefault(p => p.IsActive);
                if (active != null)
                {
                    HasActiveProgram = true;
                    ActiveProgramId = active.Id;
                    ActiveProgramName = active.Name;
                    if (active.DurationWeeks > 0 && active.ActivatedAt.HasValue)
                    {
                        var weeksSinceActivation = (int)((DateTime.UtcNow - active.ActivatedAt.Value).TotalDays / 7) + 1;
                        var weekNum = Math.Clamp(weeksSinceActivation, 1, active.DurationWeeks);
                        ActiveProgramProgress = $"Week {weekNum} of {active.DurationWeeks}";
                        ProgramProgressPercent = (double)weekNum / active.DurationWeeks;
                    }
                }
                else
                {
                    HasActiveProgram = false;
                }
            }
        });
    }

    [RelayCommand]
    private async Task NavigateToGoalsAsync(CancellationToken ct)
    {
        await _navigation.NavigateToAsync("goals");
    }

    [RelayCommand]
    private async Task NavigateToProgramsAsync(CancellationToken ct)
    {
        await _navigation.NavigateToAsync("programs");
    }

    [RelayCommand]
    private async Task NavigateToProgramDetailAsync(CancellationToken ct)
    {
        if (ActiveProgramId.HasValue)
            await _navigation.NavigateToAsync($"program-detail?programId={ActiveProgramId}");
    }

    [RelayCommand]
    private async Task NavigateToBuilderAsync(CancellationToken ct)
    {
        // Navigates to programs list for now; will go directly to builder in Commit 2
        await _navigation.NavigateToAsync("programs");
    }

    [RelayCommand]
    private async Task NavigateToLibraryAsync(CancellationToken ct)
    {
        await _navigation.NavigateToAsync("library");
    }
}
