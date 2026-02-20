using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MediatR;
using RepWizard.Application.Queries.Exercises.GetExercisePR;
using RepWizard.Application.Queries.Measurements.GetProgressChartData;
using RepWizard.Core.Interfaces;
using RepWizard.Shared.DTOs;

namespace RepWizard.UI.ViewModels;

/// <summary>
/// ViewModel for progress charts: weekly volume, strength trends, body composition, and personal records.
/// Data is sourced via GetProgressChartDataQuery and GetExercisePRQuery.
/// Chart rendering is delegated to the View (Microcharts or LiveCharts).
/// </summary>
public partial class ChartsViewModel : BaseViewModel
{
    private readonly IMediator _mediator;
    private readonly INavigationService _navigation;

    private Guid _userId;

    [ObservableProperty]
    private int _weeksBack = 12;

    [ObservableProperty]
    private ProgressChartDataDto? _chartData;

    [ObservableProperty]
    private IReadOnlyList<ExercisePRDto> _personalRecords = new List<ExercisePRDto>();

    // Summary stats derived from chart data
    [ObservableProperty]
    private decimal _totalVolumeThisWeek;

    [ObservableProperty]
    private int _totalSetsThisWeek;

    [ObservableProperty]
    private decimal _weightChangeSinceStart;

    public ChartsViewModel(IMediator mediator, INavigationService navigation)
    {
        _mediator = mediator;
        _navigation = navigation;
        Title = "Charts";
    }

    public void Initialize(Guid userId)
    {
        _userId = userId;
    }

    [RelayCommand]
    private async Task LoadAsync(CancellationToken ct)
    {
        await ExecuteSafeAsync(async () =>
        {
            var chartTask = _mediator.Send(new GetProgressChartDataQuery(_userId, WeeksBack), ct);
            var prTask = _mediator.Send(new GetExercisePRQuery(_userId), ct);

            await Task.WhenAll(chartTask, prTask);

            var chartResult = chartTask.Result;
            var prResult = prTask.Result;

            if (chartResult.IsSuccess)
            {
                ChartData = chartResult.Value;
                DeriveWeeklySummary();
            }

            if (prResult.IsSuccess)
                PersonalRecords = prResult.Value!;

            IsEmpty = ChartData == null;
        });
    }

    [RelayCommand]
    private async Task ChangeTimeRangeAsync(int weeksBack, CancellationToken ct)
    {
        WeeksBack = weeksBack;
        await LoadAsync(ct);
    }

    private void DeriveWeeklySummary()
    {
        if (ChartData?.WeeklyVolume is null || ChartData.WeeklyVolume.Count == 0) return;

        var currentWeek = ChartData.WeeklyVolume.LastOrDefault();
        if (currentWeek != null)
        {
            TotalVolumeThisWeek = currentWeek.TotalVolume;
            TotalSetsThisWeek = currentWeek.TotalSets;
        }

        if (ChartData.BodyComposition.Count >= 2)
        {
            var first = ChartData.BodyComposition.First().WeightKg ?? 0;
            var latest = ChartData.BodyComposition.Last().WeightKg ?? 0;
            WeightChangeSinceStart = latest - first;
        }
    }
}
