using RepWizard.UI.ViewModels;

namespace RepWizard.UI.Pages;

public partial class PlanHubPage : ContentPage
{
    private readonly PlanHubViewModel _viewModel;
    private CancellationTokenSource? _shimmerCts;

    public PlanHubPage(PlanHubViewModel viewModel)
    {
        InitializeComponent();
        _viewModel = viewModel;
        BindingContext = viewModel;
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        _viewModel.LoadCommand.Execute(null);
        _viewModel.LoadInsightCommand.Execute(null);
        StartShimmerAnimation();
    }

    protected override void OnDisappearing()
    {
        base.OnDisappearing();
        _shimmerCts?.Cancel();
    }

    private void StartShimmerAnimation()
    {
        _shimmerCts?.Cancel();
        _shimmerCts = new CancellationTokenSource();
        var ct = _shimmerCts.Token;

        _ = Task.Run(async () =>
        {
            while (!ct.IsCancellationRequested && _viewModel.IsInsightLoading)
            {
                await MainThread.InvokeOnMainThreadAsync(async () =>
                {
                    if (ct.IsCancellationRequested) return;
                    await InsightShimmer.FadeTo(0.1, 600, Easing.SinInOut);
                    if (ct.IsCancellationRequested) return;
                    await InsightShimmer.FadeTo(0.3, 600, Easing.SinInOut);
                });
            }
        }, ct);
    }
}
