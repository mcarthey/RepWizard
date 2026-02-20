using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using RepWizard.Core.Interfaces;

namespace RepWizard.UI.ViewModels;

/// <summary>
/// ViewModel for the Progress tab — workout history list and calendar heatmap.
/// Phase 3 will add full chart data and measurement logging.
/// </summary>
public partial class ProgressViewModel : BaseViewModel
{
    private readonly INavigationService _navigation;

    [ObservableProperty]
    private IList<object> _recentSessions = new List<object>();

    public ProgressViewModel(INavigationService navigation)
    {
        _navigation = navigation;
        Title = "Progress";
    }

    [RelayCommand]
    private async Task LoadAsync(CancellationToken ct)
    {
        await ExecuteSafeAsync(async () =>
        {
            // Phase 3: Load real session history via MediatR queries
            IsEmpty = true;
        });
    }

    [RelayCommand]
    private async Task OpenSessionDetailAsync(Guid sessionId, CancellationToken ct)
    {
        await _navigation.NavigateToAsync("progress/session",
            new Dictionary<string, object> { ["sessionId"] = sessionId });
    }

    [RelayCommand]
    private async Task OpenChartsAsync(CancellationToken ct)
    {
        await _navigation.NavigateToAsync("progress/charts");
    }

    [RelayCommand]
    private async Task OpenMeasurementsAsync(CancellationToken ct)
    {
        await _navigation.NavigateToAsync("progress/measurements");
    }
}
