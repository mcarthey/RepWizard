using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MediatR;
using RepWizard.Application.Queries.Programs.GetTrainingProgramById;
using RepWizard.Core.Interfaces;
using RepWizard.Shared.DTOs;

namespace RepWizard.UI.ViewModels;

/// <summary>
/// ViewModel for the Program Detail page -- displays a training program's
/// week-by-week structure with days, focus areas, and AI reasoning.
/// Implements IQueryAttributable to receive programId via Shell navigation.
/// </summary>
public partial class ProgramDetailViewModel : BaseViewModel, IQueryAttributable
{
    private readonly IMediator _mediator;
    private readonly INavigationService _navigation;
    private Guid _programId;

    [ObservableProperty]
    private TrainingProgramDetailDto? _program;

    [ObservableProperty]
    private string _goalDisplay = string.Empty;

    [ObservableProperty]
    private string _durationDisplay = string.Empty;

    [ObservableProperty]
    private bool _hasAiReasoning;

    [ObservableProperty]
    private string _aiReasoningDisplay = string.Empty;

    [ObservableProperty]
    private string _statusDisplay = string.Empty;

    public ProgramDetailViewModel(IMediator mediator, INavigationService navigation)
    {
        _mediator = mediator;
        _navigation = navigation;
        Title = "Program Detail";
    }

    public void ApplyQueryAttributes(IDictionary<string, object> query)
    {
        if (query.TryGetValue("programId", out var pid) && Guid.TryParse(pid?.ToString(), out var programId))
            _programId = programId;
    }

    [RelayCommand]
    public async Task LoadAsync(CancellationToken ct = default)
    {
        if (_programId == Guid.Empty) return;

        await ExecuteSafeAsync(async () =>
        {
            var result = await _mediator.Send(new GetTrainingProgramByIdQuery(_programId), ct);
            if (result.IsSuccess && result.Value != null)
            {
                Program = result.Value;
                Title = Program.Name;
                GoalDisplay = Program.GoalDescription;
                DurationDisplay = $"{Program.DurationWeeks} weeks";
                StatusDisplay = Program.IsActive ? "Active" : "Inactive";
                HasAiReasoning = Program.GeneratedByAi && !string.IsNullOrEmpty(Program.AiReasoning);
                AiReasoningDisplay = Program.AiReasoning ?? string.Empty;
            }
            else
            {
                SetError(result.Error ?? "Program not found.");
            }
        });
    }

    [RelayCommand]
    private async Task GoBackAsync(CancellationToken ct)
    {
        await _navigation.NavigateBackAsync();
    }
}
