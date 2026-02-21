using RepWizard.UI.ViewModels;

namespace RepWizard.UI.Pages;

public partial class ProgramDetailPage : ContentPage
{
    private readonly ProgramDetailViewModel _viewModel;

    public ProgramDetailPage(ProgramDetailViewModel viewModel)
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
