using RepWizard.UI.ViewModels;

namespace RepWizard.UI.Pages;

public partial class PlanHubPage : ContentPage
{
    private readonly PlanHubViewModel _viewModel;

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
    }
}
