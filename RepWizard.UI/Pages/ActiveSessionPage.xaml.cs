using RepWizard.UI.ViewModels;

namespace RepWizard.UI.Pages;

public partial class ActiveSessionPage : ContentPage
{
    public ActiveSessionPage(ActiveSessionViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
