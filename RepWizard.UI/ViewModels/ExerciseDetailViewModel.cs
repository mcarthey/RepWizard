using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MediatR;
using RepWizard.Application.Queries.Exercises.GetExerciseById;
using RepWizard.Core.Interfaces;
using RepWizard.Shared.DTOs;

namespace RepWizard.UI.ViewModels;

public partial class ExerciseDetailViewModel : BaseViewModel, IQueryAttributable
{
    private readonly IMediator _mediator;
    private readonly INavigationService _navigation;
    private Guid _exerciseId;

    [ObservableProperty] private ExerciseDto? _exercise;
    [ObservableProperty] private string _musclesDisplay = string.Empty;
    [ObservableProperty] private string _secondaryMusclesDisplay = string.Empty;
    [ObservableProperty] private string _instructionsDisplay = string.Empty;

    public ExerciseDetailViewModel(IMediator mediator, INavigationService navigation)
    {
        _mediator = mediator;
        _navigation = navigation;
        Title = "Exercise Detail";
    }

    public void ApplyQueryAttributes(IDictionary<string, object> query)
    {
        if (query.TryGetValue("exerciseId", out var eid) && Guid.TryParse(eid?.ToString(), out var id))
            _exerciseId = id;
    }

    [RelayCommand]
    public async Task LoadAsync(CancellationToken ct = default)
    {
        if (_exerciseId == Guid.Empty) return;

        await ExecuteSafeAsync(async () =>
        {
            var result = await _mediator.Send(new GetExerciseByIdQuery(_exerciseId), ct);
            if (result.IsSuccess && result.Value != null)
            {
                Exercise = result.Value;
                Title = Exercise.Name;
                MusclesDisplay = string.Join(", ", Exercise.PrimaryMuscles);
                SecondaryMusclesDisplay = string.Join(", ", Exercise.SecondaryMuscles);
                InstructionsDisplay = string.Join("\n", Exercise.Instructions
                    .Select((inst, i) => $"{i + 1}. {inst}"));
            }
            else
            {
                SetError("Exercise not found.");
            }
        });
    }
}
