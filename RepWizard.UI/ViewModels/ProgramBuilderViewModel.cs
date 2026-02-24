using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MediatR;
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
    private bool _isTemplateMode;

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

    // Advisory text (client-side, deterministic rules)
    [ObservableProperty] private string _advisoryText = string.Empty;
    [ObservableProperty] private bool _hasAdvisory;
    private string? _userExperienceLevel;

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

                _userExperienceLevel = user.ExperienceLevel;

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
                    _isTemplateMode = true;
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

                    RebuildDaysFromTemplate(template);
                    await PopulateTemplateExercisesAsync(template, ct);

                    // Skip straight to review
                    CurrentStep = 4;
                    UpdateAdvisory();
                    return;
                }
            }

            RebuildDays();
            UpdateAdvisory();
        });
    }

    partial void OnDaysPerWeekChanged(int value)
    {
        if (!_isTemplateMode)
        {
            RebuildDays();
            UpdateAdvisory();
        }
    }

    partial void OnSelectedSplitIndexChanged(int value)
    {
        if (!_isTemplateMode)
        {
            RebuildDays();
            UpdateAdvisory();
        }
    }

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

        var newDays = new ObservableCollection<BuilderDayItem>();

        for (var i = 0; i < DaysPerWeek; i++)
        {
            var focus = GetFocusForDay(splitType, i);
            newDays.Add(new BuilderDayItem
            {
                DayOfWeek = $"Day {i + 1}",
                RestDay = false,
                Focus = focus
            });
        }

        Days = newDays;
    }

    private void RebuildDaysFromTemplate(QuickStartTemplateDto template)
    {
        var newDays = new ObservableCollection<BuilderDayItem>();

        for (var i = 0; i < template.Days.Count; i++)
        {
            var templateDay = template.Days[i];
            newDays.Add(new BuilderDayItem
            {
                DayOfWeek = $"Day {i + 1}",
                RestDay = false,
                Focus = templateDay.Focus
            });
        }

        Days = newDays;
    }

    private async Task PopulateTemplateExercisesAsync(QuickStartTemplateDto template, CancellationToken ct)
    {
        // Load all exercises to match by name
        var result = await _mediator.Send(new GetExercisesQuery(null, null, null, 1, 100), ct);
        if (!result.IsSuccess || result.Value == null) return;

        var allExercises = result.Value.Items;
        var exerciseLookup = allExercises.ToDictionary(e => e.Name, e => e, StringComparer.OrdinalIgnoreCase);

        for (var i = 0; i < template.Days.Count && i < Days.Count; i++)
        {
            var templateDay = template.Days[i];
            var day = Days[i];

            foreach (var exerciseName in templateDay.ExerciseNames)
            {
                if (exerciseLookup.TryGetValue(exerciseName, out var exercise))
                {
                    day.Exercises.Add(new BuilderExerciseItem
                    {
                        ExerciseId = exercise.Id,
                        ExerciseName = exercise.Name,
                        OrderIndex = day.Exercises.Count
                    });
                }
            }
        }
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
        if (day.RestDay) return;
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

        var summary = $"{ProgramName}\n" +
                      $"{DurationWeeks} weeks • {trainingDays} days/week • {splitName}\n" +
                      $"{totalExercises} exercises • ~{SessionLengthMinutes} min/session";

        // Add per-day breakdown
        foreach (var day in Days.Where(d => !d.RestDay))
        {
            summary += $"\n\n{day.DayOfWeek} — {day.Focus}";
            foreach (var ex in day.Exercises)
                summary += $"\n  • {ex.ExerciseName} ({ex.VolumeDisplay})";
        }

        ReviewSummary = summary;
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
            var dayInputs = Days
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

    private void UpdateAdvisory()
    {
        var warnings = new List<string>();

        var isBeginner = string.Equals(_userExperienceLevel, "Beginner", StringComparison.OrdinalIgnoreCase)
                      || string.Equals(_userExperienceLevel, "Novice", StringComparison.OrdinalIgnoreCase);

        if (isBeginner && DaysPerWeek > 3)
            warnings.Add("Beginners typically benefit most from 3 sessions per week.");

        if (DurationWeeks > 4)
        {
            // Deload reminder
        }
        else if (DurationWeeks < 3)
        {
            warnings.Add("Programs under 3 weeks may not provide enough stimulus for measurable progress.");
        }

        if (DaysPerWeek >= 5 && SessionLengthMinutes > 90)
            warnings.Add("High frequency with long sessions increases recovery demands. Monitor fatigue closely.");

        if (warnings.Count > 0)
        {
            AdvisoryText = string.Join(" ", warnings);
            HasAdvisory = true;
        }
        else
        {
            AdvisoryText = string.Empty;
            HasAdvisory = false;
        }
    }

    [RelayCommand]
    private async Task CancelAsync(CancellationToken ct)
    {
        await _navigation.NavigateBackAsync();
    }
}
