using RepWizard.UI.ViewModels;

namespace RepWizard.UI.Pages;

public partial class ActiveSessionPage : ContentPage
{
    private readonly ActiveSessionViewModel _viewModel;

    public ActiveSessionPage(ActiveSessionViewModel viewModel)
    {
        InitializeComponent();
        _viewModel = viewModel;
        BindingContext = viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _viewModel.InitializeCommand.ExecuteAsync(null);
    }
}
