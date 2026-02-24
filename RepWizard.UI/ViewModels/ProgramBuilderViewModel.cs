using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MediatR;
using RepWizard.Application.Commands.Programs.ActivateProgram;
using RepWizard.Application.Commands.Programs.CreateTrainingProgram;
using RepWizard.Application.Queries.Exercises.GetExercises;
using RepWizard.Application.Queries.Users.GetUserProfile;
using RepWizard.Application.Services;
using RepWizard.Core.Interfaces;
using RepWizard.Shared.DTOs;

namespace RepWizard.UI.ViewModels;

public partial class ProgramBuilderViewModel : BaseViewModel, IQueryAttributable
{
    private readonly IMediator _mediator;
    private readonly INavigationService _navigation;
    private static readonly Guid DefaultUserId = ActiveSessionViewModel.DefaultUserId;

    private string? _templateId;
    private Guid? _editProgramId;

    // Step tracking (0-4)
    [ObservableProperty] private int _currentStep;
    [ObservableProperty] private bool _canGoBack;
    [ObservableProperty] private bool _canGoNext = true;
    [ObservableProperty] private string _nextButtonText = "Next";

    // Step 0 — Goals
    [ObservableProperty] private string? _longTermGoal;
    [ObservableProperty] private string? _shortTermFocus;
    [ObservableProperty] private string _goalForProgram = string.Empty;

    // Step 1 — Structure
    [ObservableProperty] private string _programName = string.Empty;
    [ObservableProperty] private int _daysPerWeek = 3;
    [ObservableProperty] private int _durationWeeks = 8;
    [ObservableProperty] private int _sessionLengthMinutes = 60;
    [ObservableProperty] private int _selectedSplitIndex;
    public IReadOnlyList<string> SplitTypes { get; } = new[] { "Full Body", "Upper / Lower", "Push / Pull / Legs", "Custom" };

    // Step 2 — Days + Exercise selection
    [ObservableProperty] private ObservableCollection<BuilderDayItem> _days = new();
    [ObservableProperty] private BuilderDayItem? _selectedDay;
    [ObservableProperty] private bool _showExercisePicker;
    [ObservableProperty] private string _exerciseSearch = string.Empty;
    [ObservableProperty] private ObservableCollection<ExerciseDto> _searchResults = new();

    // Step 4 — Review
    [ObservableProperty] private bool _activateImmediately = true;
    [ObservableProperty] private string _reviewSummary = string.Empty;

    public ProgramBuilderViewModel(IMediator mediator, INavigationService navigation)
    {
        _mediator = mediator;
        _navigation = navigation;
        Title = "Create Program";
    }

    public void ApplyQueryAttributes(IDictionary<string, object> query)
    {
        if (query.TryGetValue("templateId", out var tid))
            _templateId = tid?.ToString();
        if (query.TryGetValue("programId", out var pid) && Guid.TryParse(pid?.ToString(), out var programId))
            _editProgramId = programId;
    }

    [RelayCommand]
    public async Task LoadAsync(CancellationToken ct = default)
    {
        await ExecuteSafeAsync(async () =>
        {
            // Load user profile for goal pre-fill
            var profileResult = await _mediator.Send(new GetUserProfileQuery(DefaultUserId), ct);
            if (profileResult.IsSuccess && profileResult.Value != null)
            {
                var user = profileResult.Value;
                LongTermGoal = user.LongTermGoalText;
                ShortTermFocus = user.ShortTermFocusText;
                GoalForProgram = user.LongTermGoalText ?? user.ShortTermFocusText ?? string.Empty;

                if (user.AvailableDaysPerWeek.HasValue)
                    DaysPerWeek = user.AvailableDaysPerWeek.Value;
                if (user.SessionLengthMinutes.HasValue)
                    SessionLengthMinutes = user.SessionLengthMinutes.Value;
            }

            // Pre-fill from template if provided
            if (_templateId != null)
            {
                var template = QuickStartTemplates.GetById(_templateId);
                if (template != null)
                {
                    ProgramName = template.Name;
                    DaysPerWeek = template.DaysPerWeek;
                    DurationWeeks = template.DurationWeeks;
                    SessionLengthMinutes = template.SessionLengthMinutes;
                    GoalForProgram = template.Description;
                    SelectedSplitIndex = template.SplitType switch
                    {
                        "FullBody" => 0,
                        "UpperLower" => 1,
                        "PPL" => 2,
                        _ => 3
                    };
                }
            }

            RebuildDays();
        });
    }

    partial void OnDaysPerWeekChanged(int value) => RebuildDays();
    partial void OnSelectedSplitIndexChanged(int value) => RebuildDays();

    partial void OnCurrentStepChanged(int value)
    {
        CanGoBack = value > 0;
        NextButtonText = value == 4 ? "Save Program" : "Next";
        if (value == 4) BuildReviewSummary();
    }

    private void RebuildDays()
    {
        var splitType = SelectedSplitIndex switch
        {
            0 => "FullBody",
            1 => "UpperLower",
            2 => "PPL",
            _ => "Custom"
        };

        var dayNames = new[] { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" };
        var newDays = new ObservableCollection<BuilderDayItem>();

        for (var i = 0; i < 7; i++)
        {
            var isTraining = i < DaysPerWeek;
            var focus = isTraining ? GetFocusForDay(splitType, i) : null;

            newDays.Add(new BuilderDayItem
            {
                DayOfWeek = dayNames[i],
                RestDay = !isTraining,
                Focus = focus
            });
        }

        Days = newDays;
    }

    private static string GetFocusForDay(string splitType, int dayIndex) => splitType switch
    {
        "FullBody" => "Full Body",
        "UpperLower" => dayIndex % 2 == 0 ? "Upper" : "Lower",
        "PPL" => (dayIndex % 3) switch { 0 => "Push", 1 => "Pull", _ => "Legs" },
        _ => $"Day {dayIndex + 1}"
    };

    [RelayCommand]
    private void NextStep()
    {
        if (CurrentStep < 4)
            CurrentStep++;
        else
            _ = SaveProgramAsync();
    }

    [RelayCommand]
    private void PreviousStep()
    {
        if (CurrentStep > 0) CurrentStep--;
    }

    [RelayCommand]
    private void SelectDay(BuilderDayItem day)
    {
        SelectedDay = day;
        ShowExercisePicker = true;
    }

    [RelayCommand]
    private async Task SearchExercisesAsync(CancellationToken ct)
    {
        var result = await _mediator.Send(
            new GetExercisesQuery(ExerciseSearch, null, null, 1, 20), ct);
        if (result.IsSuccess)
            SearchResults = new ObservableCollection<ExerciseDto>(result.Value!.Items);
    }

    [RelayCommand]
    private void AddExerciseToDay(ExerciseDto exercise)
    {
        if (SelectedDay == null || SelectedDay.RestDay) return;

        SelectedDay.Exercises.Add(new BuilderExerciseItem
        {
            ExerciseId = exercise.Id,
            ExerciseName = exercise.Name,
            OrderIndex = SelectedDay.Exercises.Count
        });

        ShowExercisePicker = false;
    }

    [RelayCommand]
    private void RemoveExercise(BuilderExerciseItem exercise)
    {
        foreach (var day in Days)
            day.Exercises.Remove(exercise);
    }

    [RelayCommand]
    private void CloseExercisePicker()
    {
        ShowExercisePicker = false;
    }

    private void BuildReviewSummary()
    {
        var trainingDays = Days.Count(d => !d.RestDay);
        var totalExercises = Days.Sum(d => d.Exercises.Count);
        var splitName = SplitTypes[SelectedSplitIndex];

        ReviewSummary = $"{ProgramName}\n" +
                        $"{DurationWeeks} weeks • {trainingDays} days/week • {splitName}\n" +
                        $"{totalExercises} exercises • ~{SessionLengthMinutes} min/session";
    }

    [RelayCommand]
    private async Task SaveProgramAsync(CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(ProgramName))
        {
            SetError("Please enter a program name.");
            CurrentStep = 1;
            return;
        }

        await ExecuteSafeAsync(async () =>
        {
            var dayInputs = Days.Where(d => !d.RestDay || true) // include all days
                .Select(d => new ProgramDayInput
                {
                    DayOfWeek = d.DayOfWeek,
                    RestDay = d.RestDay,
                    Focus = d.Focus,
                    Exercises = d.Exercises.Select(e => new ProgramExerciseInput
                    {
                        ExerciseId = e.ExerciseId,
                        OrderIndex = e.OrderIndex,
                        SetCount = e.SetCount,
                        MinReps = e.MinReps,
                        MaxReps = e.MaxReps,
                        RestSeconds = e.RestSeconds,
                        ProgressionRule = e.ProgressionRule
                    }).ToList()
                }).ToList();

            var command = new CreateTrainingProgramCommand(
                UserId: DefaultUserId,
                Name: ProgramName,
                DurationWeeks: DurationWeeks,
                GoalDescription: GoalForProgram,
                GeneratedByAi: false,
                AiReasoning: null,
                ActivateImmediately: ActivateImmediately,
                Days: dayInputs);

            var result = await _mediator.Send(command, ct);
            if (result.IsSuccess)
            {
                await _navigation.NavigateBackAsync();
            }
            else
            {
                SetError(result.Error ?? "Failed to save program.");
            }
        }, "Failed to save program");
    }

    [RelayCommand]
    private async Task CancelAsync(CancellationToken ct)
    {
        await _navigation.NavigateBackAsync();
    }
}
