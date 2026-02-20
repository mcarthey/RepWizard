using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MediatR;
using RepWizard.Application.Queries.Workouts.GetSessionHistory;
using RepWizard.Core.Interfaces;
using RepWizard.Shared.DTOs;

namespace RepWizard.UI.ViewModels;

/// <summary>
/// ViewModel for the Progress tab — workout history list, navigation to charts and measurements.
/// Loads paginated session history via GetSessionHistoryQuery.
/// </summary>
public partial class ProgressViewModel : BaseViewModel
{
    private readonly IMediator _mediator;
    private readonly INavigationService _navigation;

    private Guid _userId;
    private int _currentPage = 1;
    private const int PageSize = 20;

    [ObservableProperty]
    private IList<WorkoutHistoryDto> _sessions = new List<WorkoutHistoryDto>();

    [ObservableProperty]
    private bool _hasMorePages;

    [ObservableProperty]
    private int _totalSessionCount;

    public ProgressViewModel(IMediator mediator, INavigationService navigation)
    {
        _mediator = mediator;
        _navigation = navigation;
        Title = "Progress";
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
            _currentPage = 1;
            var result = await _mediator.Send(
                new GetSessionHistoryQuery(_userId, _currentPage, PageSize), ct);

            if (result.IsFailure)
            {
                SetError(result.Error ?? "Failed to load session history.");
                return;
            }

            var paged = result.Value!;
            Sessions = paged.Items.ToList();
            TotalSessionCount = paged.TotalCount;
            HasMorePages = paged.Items.Count == PageSize;
            IsEmpty = Sessions.Count == 0;
        });
    }

    [RelayCommand]
    private async Task LoadMoreAsync(CancellationToken ct)
    {
        if (!HasMorePages) return;
        await ExecuteSafeAsync(async () =>
        {
            _currentPage++;
            var result = await _mediator.Send(
                new GetSessionHistoryQuery(_userId, _currentPage, PageSize), ct);

            if (result.IsSuccess)
            {
                foreach (var s in result.Value!.Items)
                    Sessions.Add(s);
                HasMorePages = result.Value.Items.Count == PageSize;
            }
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
