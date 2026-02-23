using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MediatR;
using RepWizard.Application.Commands.Users.UpdateProfile;
using RepWizard.Application.Queries.Users.GetUserProfile;
using RepWizard.Core.Interfaces;

namespace RepWizard.UI.ViewModels;

/// <summary>
/// ViewModel for the Goals editor page — edits long-term, short-term goals,
/// training constraints, and limitations on the user profile.
/// </summary>
public partial class GoalsViewModel : BaseViewModel
{
    private readonly IMediator _mediator;
    private readonly INavigationService _navigation;
    private static readonly Guid DefaultUserId = ActiveSessionViewModel.DefaultUserId;

    [ObservableProperty] private string? _longTermGoalText;
    [ObservableProperty] private string _longTermGoalMonthsText = string.Empty;
    [ObservableProperty] private string? _shortTermFocusText;
    [ObservableProperty] private string _shortTermFocusWeeksText = string.Empty;
    [ObservableProperty] private string _availableDaysPerWeekText = string.Empty;
    [ObservableProperty] private string _sessionLengthMinutesText = string.Empty;
    [ObservableProperty] private string? _availableEquipment;
    [ObservableProperty] private string? _movementLimitations;

    public GoalsViewModel(IMediator mediator, INavigationService navigation)
    {
        _mediator = mediator;
        _navigation = navigation;
        Title = "Training Goals";
    }

    [RelayCommand]
    public async Task LoadAsync(CancellationToken ct = default)
    {
        await ExecuteSafeAsync(async () =>
        {
            var result = await _mediator.Send(new GetUserProfileQuery(DefaultUserId), ct);
            if (result.IsSuccess && result.Value != null)
            {
                var user = result.Value;
                LongTermGoalText = user.LongTermGoalText;
                LongTermGoalMonthsText = user.LongTermGoalMonths?.ToString() ?? "";
                ShortTermFocusText = user.ShortTermFocusText;
                ShortTermFocusWeeksText = user.ShortTermFocusWeeks?.ToString() ?? "";
                AvailableDaysPerWeekText = user.AvailableDaysPerWeek?.ToString() ?? "";
                SessionLengthMinutesText = user.SessionLengthMinutes?.ToString() ?? "";
                AvailableEquipment = user.AvailableEquipment;
                MovementLimitations = user.MovementLimitations;
            }
        });
    }

    [RelayCommand]
    private async Task SaveGoalsAsync(CancellationToken ct)
    {
        await ExecuteSafeAsync(async () =>
        {
            int? longTermMonths = int.TryParse(LongTermGoalMonthsText, out var ltm) ? ltm : null;
            int? shortTermWeeks = int.TryParse(ShortTermFocusWeeksText, out var stw) ? stw : null;
            int? daysPerWeek = int.TryParse(AvailableDaysPerWeekText, out var dpw) ? dpw : null;
            int? sessionMinutes = int.TryParse(SessionLengthMinutesText, out var sm) ? sm : null;

            var result = await _mediator.Send(new UpdateProfileCommand(
                DefaultUserId,
                Name: null,
                DateOfBirth: null,
                HeightCm: null,
                WeightKg: null,
                FitnessGoal: null,
                ExperienceLevel: null,
                MedicalNotes: null,
                LongTermGoalText: LongTermGoalText,
                LongTermGoalMonths: longTermMonths,
                ShortTermFocusText: ShortTermFocusText,
                ShortTermFocusWeeks: shortTermWeeks,
                AvailableDaysPerWeek: daysPerWeek,
                SessionLengthMinutes: sessionMinutes,
                AvailableEquipment: AvailableEquipment,
                MovementLimitations: MovementLimitations), ct);

            if (result.IsSuccess)
                await _navigation.NavigateBackAsync();
            else
                SetError(result.Error ?? "Failed to save goals.");
        }, "Failed to save goals");
    }
}
