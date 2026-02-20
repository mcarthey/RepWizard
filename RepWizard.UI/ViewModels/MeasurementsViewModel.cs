using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MediatR;
using RepWizard.Application.Commands.Measurements.LogBodyMeasurement;
using RepWizard.Application.Queries.Measurements.GetMeasurementHistory;
using RepWizard.Core.Interfaces;
using RepWizard.Shared.DTOs;

namespace RepWizard.UI.ViewModels;

/// <summary>
/// ViewModel for logging and viewing body composition measurements.
/// Users can log weight, body fat %, and muscle kg. History is displayed in reverse chronological order.
/// </summary>
public partial class MeasurementsViewModel : BaseViewModel
{
    private readonly IMediator _mediator;
    private readonly INavigationService _navigation;

    private Guid _userId;

    // Form fields for new measurement entry
    [ObservableProperty]
    private string _weightKgText = string.Empty;

    [ObservableProperty]
    private string _bodyFatPercentText = string.Empty;

    [ObservableProperty]
    private string _muscleKgText = string.Empty;

    [ObservableProperty]
    private string _measurementNotes = string.Empty;

    [ObservableProperty]
    private bool _isLoggingForm;

    // History
    [ObservableProperty]
    private IList<BodyMeasurementDto> _measurements = new List<BodyMeasurementDto>();

    // Latest measurement for summary display
    [ObservableProperty]
    private BodyMeasurementDto? _latestMeasurement;

    public MeasurementsViewModel(IMediator mediator, INavigationService navigation)
    {
        _mediator = mediator;
        _navigation = navigation;
        Title = "Measurements";
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
            var result = await _mediator.Send(new GetMeasurementHistoryQuery(_userId), ct);

            if (result.IsFailure)
            {
                SetError(result.Error ?? "Failed to load measurements.");
                return;
            }

            Measurements = result.Value!.ToList();
            LatestMeasurement = Measurements.FirstOrDefault();
            IsEmpty = Measurements.Count == 0;
        });
    }

    [RelayCommand]
    private void ShowLoggingForm()
    {
        WeightKgText = string.Empty;
        BodyFatPercentText = string.Empty;
        MuscleKgText = string.Empty;
        MeasurementNotes = string.Empty;
        IsLoggingForm = true;
    }

    [RelayCommand]
    private void HideLoggingForm()
    {
        IsLoggingForm = false;
    }

    [RelayCommand]
    private async Task SaveMeasurementAsync(CancellationToken ct)
    {
        await ExecuteSafeAsync(async () =>
        {
            decimal? weight = decimal.TryParse(WeightKgText, out var w) ? w : null;
            decimal? bodyFat = decimal.TryParse(BodyFatPercentText, out var bf) ? bf : null;
            decimal? muscle = decimal.TryParse(MuscleKgText, out var m) ? m : null;
            var notes = string.IsNullOrWhiteSpace(MeasurementNotes) ? null : MeasurementNotes;

            var result = await _mediator.Send(
                new LogBodyMeasurementCommand(_userId, weight, bodyFat, muscle, notes), ct);

            if (result.IsFailure)
            {
                SetError(result.Error ?? "Failed to save measurement.");
                return;
            }

            Measurements.Insert(0, result.Value!);
            LatestMeasurement = result.Value;
            IsLoggingForm = false;
            IsEmpty = false;
        });
    }
}
