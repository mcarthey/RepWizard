using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MediatR;
using RepWizard.Application.Queries.Programs.GetTrainingPrograms;
using RepWizard.Core.Interfaces;
using RepWizard.Shared.DTOs;

namespace RepWizard.UI.ViewModels;

/// <summary>
/// ViewModel for the Programs page -- displays all training programs for the user.
/// Loads programs via GetTrainingProgramsQuery and supports navigation to detail and AI chat.
/// </summary>
public partial class ProgramsViewModel : BaseViewModel
{
    private readonly IMediator _mediator;
    private readonly INavigationService _navigation;
    private static readonly Guid DefaultUserId = ActiveSessionViewModel.DefaultUserId;

    [ObservableProperty]
    private IReadOnlyList<TrainingProgramDto> _programs = new List<TrainingProgramDto>();

    public ProgramsViewModel(IMediator mediator, INavigationService navigation)
    {
        _mediator = mediator;
        _navigation = navigation;
        Title = "Programs";
    }

    [RelayCommand]
    public async Task LoadAsync(CancellationToken ct = default)
    {
        await ExecuteSafeAsync(async () =>
        {
            var result = await _mediator.Send(new GetTrainingProgramsQuery(DefaultUserId), ct);
            if (result.IsSuccess)
            {
                Programs = result.Value!;
                IsEmpty = Programs.Count == 0;
            }
            else
            {
                SetError(result.Error ?? "Failed to load programs.");
            }
        });
    }

    [RelayCommand]
    private async Task NavigateToDetailAsync(TrainingProgramDto program, CancellationToken ct)
    {
        await _navigation.NavigateToAsync($"program-detail?programId={program.Id}");
    }

    [RelayCommand]
    private async Task NavigateToAiChatAsync(CancellationToken ct)
    {
        await _navigation.NavigateToAsync("ai-chat?source=programs");
    }
}
