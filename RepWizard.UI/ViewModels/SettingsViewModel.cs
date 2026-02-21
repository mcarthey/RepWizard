using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MediatR;
using RepWizard.Application.Commands.Users.UpdateProfile;
using RepWizard.Application.Queries.Users.GetUserProfile;
using RepWizard.Core.Interfaces;

namespace RepWizard.UI.ViewModels;

public partial class SettingsViewModel : BaseViewModel
{
    private readonly IMediator _mediator;
    private readonly INavigationService _navigation;
    private readonly ISyncService _syncService;

    internal static readonly Guid DefaultUserId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    [ObservableProperty] private string _name = string.Empty;
    [ObservableProperty] private string _email = string.Empty;
    [ObservableProperty] private string _heightCmText = string.Empty;
    [ObservableProperty] private string _weightKgText = string.Empty;
    [ObservableProperty] private string _selectedFitnessGoal = "GeneralFitness";
    [ObservableProperty] private string _selectedExperienceLevel = "Beginner";
    [ObservableProperty] private string? _medicalNotes;
    [ObservableProperty] private bool _isEditing;
    [ObservableProperty] private bool _hasPendingSync;
    [ObservableProperty] private string _syncStatusText = "Up to date";
    [ObservableProperty] private bool _isSyncing;

    public IReadOnlyList<string> FitnessGoals { get; } = new[]
    {
        "StrengthGain", "MuscleHypertrophy", "FatLoss", "GeneralFitness",
        "Endurance", "PowerAndAthletics", "Rehabilitation"
    };

    public IReadOnlyList<string> ExperienceLevels { get; } = new[]
    {
        "Beginner", "Novice", "Intermediate", "Advanced", "Elite"
    };

    public SettingsViewModel(IMediator mediator, INavigationService navigation, ISyncService syncService)
    {
        _mediator = mediator;
        _navigation = navigation;
        _syncService = syncService;
    }

    [RelayCommand]
    private async Task LoadAsync()
    {
        if (IsLoading) return;
        IsLoading = true;

        try
        {
            var result = await _mediator.Send(new GetUserProfileQuery(DefaultUserId));
            if (result.IsSuccess && result.Value != null)
            {
                var user = result.Value;
                Name = user.Name;
                Email = user.Email;
                HeightCmText = user.HeightCm?.ToString("F1") ?? "";
                WeightKgText = user.WeightKg?.ToString("F1") ?? "";
                SelectedFitnessGoal = user.FitnessGoal;
                SelectedExperienceLevel = user.ExperienceLevel;
                MedicalNotes = user.MedicalNotes;
            }

            HasPendingSync = await _syncService.HasPendingChangesAsync(DefaultUserId);
            SyncStatusText = HasPendingSync ? "Changes pending" : "Up to date";
        }
        catch (Exception ex)
        {
            ErrorMessage = ex.Message;
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task SaveProfileAsync()
    {
        if (IsLoading) return;
        IsLoading = true;

        try
        {
            decimal? height = decimal.TryParse(HeightCmText, out var h) ? h : null;
            decimal? weight = decimal.TryParse(WeightKgText, out var w) ? w : null;

            var result = await _mediator.Send(new UpdateProfileCommand(
                DefaultUserId, Name, null, height, weight,
                SelectedFitnessGoal, SelectedExperienceLevel, MedicalNotes));

            if (result.IsSuccess)
                IsEditing = false;
            else
                ErrorMessage = result.Error;
        }
        catch (Exception ex)
        {
            ErrorMessage = ex.Message;
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task SyncNowAsync()
    {
        if (IsSyncing) return;
        IsSyncing = true;
        SyncStatusText = "Syncing...";

        try
        {
            var result = await _syncService.SyncAsync(DefaultUserId);
            SyncStatusText = result.Success
                ? $"Synced {result.EntitiesPushed} pushed, {result.EntitiesPulled} pulled"
                : $"Sync failed: {result.ErrorMessage}";
            HasPendingSync = await _syncService.HasPendingChangesAsync(DefaultUserId);
        }
        catch (Exception ex)
        {
            SyncStatusText = $"Sync error: {ex.Message}";
        }
        finally
        {
            IsSyncing = false;
        }
    }

    [RelayCommand]
    private void ToggleEdit() => IsEditing = !IsEditing;
}
