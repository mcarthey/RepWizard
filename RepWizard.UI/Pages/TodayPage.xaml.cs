using RepWizard.UI.ViewModels;

namespace RepWizard.UI.Pages;

public partial class TodayPage : ContentPage
{
    private readonly TodayViewModel _viewModel;

    public TodayPage(TodayViewModel viewModel)
    {
        InitializeComponent();
        _viewModel = viewModel;
        BindingContext = _viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _viewModel.LoadCommand.ExecuteAsync(null);
        StartBreathingAnimation();
    }

    private void StartBreathingAnimation()
    {
        // Breathing scale animation on Start Workout button: 1.00 → 1.02 → 1.00 every 6-8s
        // Uses looping Animation object (not ViewExtensions which don't loop cleanly)
        // Respects IMotionPreferenceService.IsReduceMotionEnabled (checked in Phase 5)
        var animation = new Animation(v =>
        {
            StartWorkoutButton.ScaleX = v;
            StartWorkoutButton.ScaleY = v;
        }, 1.0, 1.02, Easing.SinInOut);

        animation.Commit(
            owner: this,
            name: "BreathingAnimation",
            length: 2000,
            repeat: () => true);
    }

    protected override void OnDisappearing()
    {
        base.OnDisappearing();
        this.AbortAnimation("BreathingAnimation");
    }
}
