using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MediatR;
using RepWizard.Application.Queries.Workouts.GetWorkoutSession;
using RepWizard.Core.Interfaces;
using RepWizard.Shared.DTOs;

namespace RepWizard.UI.ViewModels;

/// <summary>
/// ViewModel for reviewing a completed workout session.
/// Displays all exercises, sets, weights, and performance metrics.
/// </summary>
public partial class SessionDetailViewModel : BaseViewModel
{
    private readonly IMediator _mediator;
    private readonly INavigationService _navigation;

    [ObservableProperty]
    private WorkoutSessionDto? _session;

    [ObservableProperty]
    private string _durationDisplay = string.Empty;

    [ObservableProperty]
    private string _volumeDisplay = string.Empty;

    [ObservableProperty]
    private string _dateDisplay = string.Empty;

    public SessionDetailViewModel(IMediator mediator, INavigationService navigation)
    {
        _mediator = mediator;
        _navigation = navigation;
        Title = "Session Detail";
    }

    [RelayCommand]
    public async Task LoadAsync(Guid sessionId, CancellationToken ct = default)
    {
        await ExecuteSafeAsync(async () =>
        {
            var result = await _mediator.Send(new GetWorkoutSessionQuery(sessionId), ct);

            if (result.IsFailure)
            {
                SetError(result.Error ?? "Session not found.");
                IsEmpty = true;
                return;
            }

            Session = result.Value;

            if (Session != null)
            {
                DateDisplay = Session.StartedAt.ToString("dddd, MMMM d");

                if (Session.CompletedAt.HasValue)
                {
                    var duration = Session.CompletedAt.Value - Session.StartedAt;
                    DurationDisplay = duration.TotalMinutes < 60
                        ? $"{(int)duration.TotalMinutes}m"
                        : $"{(int)duration.TotalHours}h {duration.Minutes}m";
                }

                var totalVolume = Session.SessionExercises
                    .SelectMany(se => se.Sets)
                    .Sum(s => (s.WeightKg ?? 0) * s.Reps);
                VolumeDisplay = $"{totalVolume:N0} kg";

                IsEmpty = false;
            }
        });
    }
}
