using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;

namespace RepWizard.UI.ViewModels;

public partial class BuilderDayItem : ObservableObject
{
    [ObservableProperty] private string _dayOfWeek = string.Empty;
    [ObservableProperty] private string? _focus;
    [ObservableProperty] private bool _restDay;
    [ObservableProperty] private ObservableCollection<BuilderExerciseItem> _exercises = new();

    public int ExerciseCount => Exercises.Count;
    public string Summary => RestDay ? "Rest Day" : $"{Focus} — {Exercises.Count} exercises";
}

public partial class BuilderExerciseItem : ObservableObject
{
    [ObservableProperty] private Guid _exerciseId;
    [ObservableProperty] private string _exerciseName = string.Empty;
    [ObservableProperty] private int _setCount = 3;
    [ObservableProperty] private int _minReps = 8;
    [ObservableProperty] private int _maxReps = 12;
    [ObservableProperty] private int _restSeconds = 120;
    [ObservableProperty] private string _progressionRule = "DoubleProgression";
    public int OrderIndex { get; set; }

    public string VolumeDisplay => $"{SetCount} × {MinReps}-{MaxReps} reps";
}
