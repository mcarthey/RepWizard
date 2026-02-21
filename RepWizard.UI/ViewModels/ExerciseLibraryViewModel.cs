using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MediatR;
using RepWizard.Application.Queries.Exercises.GetExercises;
using RepWizard.Core.Enums;
using RepWizard.Core.Interfaces;
using RepWizard.Shared.DTOs;

namespace RepWizard.UI.ViewModels;

public partial class ExerciseLibraryViewModel : BaseViewModel
{
    private readonly IMediator _mediator;
    private readonly INavigationService _navigation;
    private int _currentPage = 1;
    private const int PageSize = 20;

    [ObservableProperty] private IReadOnlyList<ExerciseDto> _exercises = new List<ExerciseDto>();
    [ObservableProperty] private string _searchText = string.Empty;
    [ObservableProperty] private string? _selectedCategory;
    [ObservableProperty] private bool _hasMorePages;

    public IReadOnlyList<string> CategoryOptions { get; } =
        new List<string> { "All", "Strength", "Cardio", "Flexibility", "Balance", "Power", "Rehabilitation", "Warmup", "Cooldown" };

    public ExerciseLibraryViewModel(IMediator mediator, INavigationService navigation)
    {
        _mediator = mediator;
        _navigation = navigation;
        Title = "Exercise Library";
        _selectedCategory = "All";
    }

    [RelayCommand]
    private async Task LoadAsync(CancellationToken ct)
    {
        await ExecuteSafeAsync(async () =>
        {
            _currentPage = 1;
            var result = await QueryExercises(ct);
            if (result.IsSuccess)
            {
                Exercises = result.Value!.Items;
                HasMorePages = result.Value.TotalCount > _currentPage * PageSize;
                IsEmpty = Exercises.Count == 0;
            }
        });
    }

    [RelayCommand]
    private async Task SearchAsync(CancellationToken ct)
    {
        await LoadAsync(ct);
    }

    [RelayCommand]
    private async Task LoadMoreAsync(CancellationToken ct)
    {
        if (!HasMorePages) return;

        await ExecuteSafeAsync(async () =>
        {
            _currentPage++;
            var result = await QueryExercises(ct);
            if (result.IsSuccess)
            {
                var combined = new List<ExerciseDto>(Exercises);
                combined.AddRange(result.Value!.Items);
                Exercises = combined;
                HasMorePages = result.Value.TotalCount > _currentPage * PageSize;
            }
        });
    }

    [RelayCommand]
    private async Task NavigateToDetailAsync(ExerciseDto exercise, CancellationToken ct)
    {
        await _navigation.NavigateToAsync($"coach/library/detail?exerciseId={exercise.Id}");
    }

    partial void OnSelectedCategoryChanged(string? value)
    {
        LoadCommand.Execute(null);
    }

    private async Task<Core.Common.Result<PagedResult<ExerciseDto>>> QueryExercises(CancellationToken ct)
    {
        var search = string.IsNullOrWhiteSpace(SearchText) ? null : SearchText;
        ExerciseCategory? category = SelectedCategory != null && SelectedCategory != "All"
            && Enum.TryParse<ExerciseCategory>(SelectedCategory, out var cat) ? cat : null;

        return await _mediator.Send(
            new GetExercisesQuery(search, category, null, _currentPage, PageSize), ct);
    }
}
