using RepWizard.UI.ViewModels;

namespace RepWizard.UI.Pages;

public partial class ProgramsPage : ContentPage
{
    private readonly ProgramsViewModel _viewModel;

    public ProgramsPage(ProgramsViewModel viewModel)
    {
        InitializeComponent();
        _viewModel = viewModel;
        BindingContext = viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _viewModel.LoadCommand.ExecuteAsync(null);
    }
}
